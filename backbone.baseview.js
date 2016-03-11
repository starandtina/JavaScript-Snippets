define([
  'jquery',
  'active/endurance/base/underscore_extension',
  'active/endurance/base/flux/FluxEventEmitter',
  'backbone',
  'active/endurance/active'
], function ($, _, FluxEventEmitter, Backbone, active) {
  'use strict';

  function stopListening(target) {
    if (target) {
      if (_.isFunction(target.stopListening)) {
        target.stopListening();
      }
      if (_.isFunction(target.stopListeningToAll)) {
        target.stopListeningToAll();
      }
    }
  }

  Backbone.View.prototype.close = function () {
    // Disposing arch-html components and call `dispose` method on every component if exists
    _.chain(this.$el.find('[data-render]').toArray()).filter(function (componentDOM) {
      return $(componentDOM).data('_impl');
    }).map(function (componentDOM) {
      return active.getComponent(componentDOM);
    }).compact().filter(function (component) {
      return _.isFunction(component['dispose']);
    }).invoke('dispose');

    // Your custom clean code placed here
    if (this.onClose) {
      this.onClose();
    }

    // `stopListening` on Model and Collection
    stopListening.call(this, this.model);
    stopListening.call(this, this.collection);

    // Remove `this.el` and related events from DOM
    this.remove();
    // Off any events that current view is bound to
    this.off();

    return this;
  };

  Backbone.View.hasUnsavedModel = function (view) {
    var viewHasUnsavedModel = view.hasUnsavedModel ? view.hasUnsavedModel() : false;

    if (viewHasUnsavedModel) {
      return true;
    } else {
      view.childViews = view.childViews || [];

      for (var i = 0, l = view.childViews.length; i < l; i++) {
        if (Backbone.View.hasUnsavedModel(view.childViews[i])) {
          return true;
        }
      }
      return false;
    }
  };

  return Backbone.View.extend({
    constructor: function (options) {
      _.bindAll.apply(_, [this].concat(_.functions(this)));

      this.options = _.extend(this.options || {}, options || {});
      this.name = this.name || _.uniqueId('view');

      var mixins = [].concat(this.mixins);
      _.forEach(mixins, function (mixin) {
        _.extend(this, mixin);
      }, this);

      Backbone.View.apply(this, arguments);
    },
    name: null,
    parentView: null,
    getInnerHtml: function () {
      var template = this.getTemplate();
      var data = this.getTemplateData();

      this._preRender();

      if (template == null) {
        throw new Error(this.name + ": template \"" + this.getTemplateName() + "\" not found.");
      }

      return active.localize.parse(template(data));
    },
    getTemplate: function () {
      return this.template;
    },
    getTemplateName: function () {
      return this.name;
    },
    getTemplateData: function () {
      var data;
      var parsedOptions;

      if (this.model) {
        data = this.model.toJSON();
      } else if (this.collection) {
        data = {
          models: this.collection.toJSON(),
          meta: this.collection.meta,
          params: this.collection.params
        };
      }

      // Remove options that are duplicates in the templates
      parsedOptions = _.omit(this.options, ['model', 'collection', 'meta', 'params']);

      return _.extend({}, data, parsedOptions);
    },
    getAttributes: function () {
      var attributes = _.extend({}, _.result(this, 'attributes'));

      attributes['data-view'] = this.name;

      return attributes;
    },
    _preRender: function () {
      this.trigger('preRender');
    },
    _postRender: function () {
      this.removeChildViews();
      this.addReferences();
      this.trigger('postRender');

      return this;
    },
    _preRenderComponents: function () {
      this.trigger('preRenderComponents');
    },
    _postRenderComponents: function () {
      var hash = this._references || _.result(this, 'references');

      for (var item in hash) {
        this[item] = active.getComponent(this.$(hash[item]));
      }
      this.trigger('postRenderComponents');
    },
    onRenderComponentsDone: function () {
      active.app.applyPermissionsToHtml(this.$el);
      active.app.applyFeaturesToHtml(this.$el);
      this._postRenderComponents();
    },
    _activeRenderCallback: function ($html) {
      this.$el.html($html);
      this.onRenderComponentsDone();
    },
    render: function () {
      var html = this.getInnerHtml();
      var $html = $(html);

      this.$el.attr(this.getAttributes());
      this._postRender();

      this._preRenderComponents();
      active.render($html, _.partial(this._activeRenderCallback, $html));

      return this;
    },
    preRender: _.noop,
    postRender: _.noop,
    preRenderComponents: _.noop,
    postRenderComponents: _.noop,
    registerChildView: function (view, name) {
      var childViews = this.getChildViews();
      // Storage for our child view
      name = name || view.cid
      childViews[name] = view;

      if (view.el) {
        view.parent = view.parentView = this;
      }

      return view;
    },
    // Proxy for `registerChildView`
    registerSubview: function () {
      this.registerChildView.apply(this, arguments);
    },
    renderChildViews: function (selector, view) {
      var selectors;

      if (_.isObject(selector)) {
        selectors = selector;
      } else {
        selectors = {};
        selectors[selector] = view;
      }

      if (!selectors) return;

      _.each(selectors, function (view, selector) {
        // create a reference back to this (parent) view
        view.parent = view.parentView = this;
        view.selector = selector;

        if (view.appendToParent) {
          view.name = selector;
          view.render();
          this.$el.append(view.el);
        } else {
          // change the view's element (`this.el` property), including re-delegation events
          view.setElement(this.$(selector)).render();
        }
        // cache the childViews in order to remove it when exiting
        this.registerChildView(view);
      }, this);

      return this;
    },
    assign: function () {
      this.renderChildViews.apply(this, arguments);
    },
    where: function (attrs, first) {
      var matches = _.matches(attrs);
      var childViews = this.getChildViews();
      return this[first ? 'find' : 'filter'](childViews, function (childView) {
        return matches(childView);
      });
    },
    find: function () {
      return _.find.apply(_, arguments);
    },
    filter: function () {
      return _.filter.apply(_, arguments);
    },
    findWhere: function (attrs) {
      return this.where(attrs, true);
    },
    getChildViewsByName: function (name) {
      return this.where({
        name: name
      });
    },
    getChildViewByName: function (name) {
      return this.findWhere({
        name: name
      });
    },
    getChildViewBySelector: function (selector) {
      return this.findWhere({
        selector: selector
      });
    },
    getSubViewBySelector: function () {
      return this.getChildViewBySelector.apply(this, arguments);
    },
    trigger: function (channel) {
      if (_.isFunction(this[channel])) {
        this[channel].apply(this, [].slice.call(arguments, 1));
      }

      Backbone.View.prototype.trigger.apply(this, arguments);

      return this;
    }, // Rendering a collections with individual views.
    // Just pass it the collection, and the view to use for the items in the
    // collection.
    renderCollection: function (collection, ViewClass, container, opts) {
      var self = this;
      var views = [];
      var options = _.defaults(opts || {}, {
        filter: null,
        viewOptions: {},
        reverse: false
      });
      var containerEl = this.$(container);

      function getViewBy(model) {
        return _.find(views, function (view) {
          return model === view.model;
        });
      }

      function addView(model, index, collection) {
        var matches = options.filter ? options.filter(model) : true;
        var view;

        if (matches) {
          model.set('_isLast', collection.length - 1 === index, {
            silent: true
          });
          view = getViewBy(model);
          if (!view) {
            view = new ViewClass(_.chain({
              model: model,
              collection: collection
            }).extend(options.viewOptions).value());
            views.push(view);
            view.parent = self;
            view.renderedByParentView = true;
            view.render({
              containerEl: container
            });
            // store a reference on the view to it's collection views
            // so we can clean up memory references when we're done
            self.registerChildView(view);
          }
          // give the option for the view to choose where it's inserted if you so choose
          if (!view.insertSelf) containerEl[options.reverse ? 'prepend' : 'append'](view.el);
          view.delegateEvents();
        }
      }

      function reRender() {
        var parent = containerEl[0];
        // Damn it! IE 8 will throw error here as whether the slice function can be applied successfully to a host object is implementation-dependent.
        // var childNodes = Array.prototype.slice.call(parent.childNodes);
        var childNodes = _.toArray(parent.childNodes);
        _.each(childNodes, function (child) {
          parent.removeChild(child);
        });
        collection.each(addView);
      }
      this.listenTo(collection, 'add', addView);
      this.listenTo(collection, 'remove', function (model) {
        var index = views.indexOf(getViewBy(model));
        if (index !== -1) {
          views.splice(index, 1)[0].remove();
        }
      });
      this.listenTo(collection, 'move sort', reRender);
      this.listenTo(collection, 'refresh reset', function () {
        while (views.length) {
          views.pop().remove();
        }
        reRender();
      });
      reRender();
    },
    addReferences: function (hash) {
      hash = hash || _.result(this, 'references');

      this._references = _.defaults({}, this._references, hash);

      for (var item in hash) {
        this['$' + item] = this.$(hash[item]);
      }
    },
    // Reducing boilerplate and set up one-one releation between DOM and component
    references: function () {
      return _.reduce(_.result(this, 'dom') || {}, function (memo, v, k) {
        memo[_.camelize(k.toLocaleLowerCase())] = v;

        return memo;
      }, {});
    },
    // Refer to **fnd/arch/events/NavExitEvent** for argument of navExitEvent
    exit: function (navExitEvent) {
      // Disposing view hierarchies
      this.removeChildViews();
      this.childViews = null;
      this.parentView = null;

      // Prefer to use `listenTo` instead of `this.model.on` but we should prevent it from memory leak
      var obj = this.model || this.collection;

      if (obj) {
        obj.off(null, null, this);
      }

      // Removing current view out of the DOM
      // Stop listening any events binding through `listenTo`
      this.close();

      // Trigger `remove` event
      this.trigger('remove');

      // 1. Empty **#navigationContainer**
      // 2. Navigate to a brand path
      navExitEvent.complete();
    },
    removeChildViews: function () {
      _.forEach(this.getChildViews(), function (childView, name) {
        this.removeChildView(childView, name);
      }, this);

      return this;
    },
    removeChildView: function (childView, name) {
      name = name || childView.cid;

      if (childView && _.isFunction(childView.close)) {
        childView.close();
      }

      var childViews = this.getChildViews();

      delete this.childViews[name];
    },
    getChildViews: function () {
      this.childViews = this.childViews || {};

      return this.childViews;
    },
    // Used by `active.navigator` as an entry point
    enter: function () {
      this.render();

      return this.$el;
    }
  });
});
