define([
  'jquery',
  'lodash',
  'backbone',
  'active/endurance/base/active'
], function ($, _, Backbone, active) {
  'use strict';

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

    // Remove `this.el` and related events from DOM
    this.remove();
    // Off any events that current view is bound to
    this.off();

    return this;
  };

  return Backbone.View.extend({
    constructor: function (options) {
      _.bindAll.apply(_, [this].concat(_.functions(this)));

      this.options = _.extend(this.options || {}, options || {});
      this.name = this.name || _.uniqueId('view');

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
      this.trigger('postRenderComponents');
      // Integrate with {active.endurance.base.View}
      Backbone.View.prototype.trigger.call(this, 'render');
    },
    onRenderComponentsDone: function () {
      this._postRenderComponents();
    },
    render: function () {
      var html = this.getInnerHtml();

      this.$el.html(html);
      this.$el.attr(this.getAttributes());
      this._postRender();

      this._preRenderComponents();
      active.render(this.$el, this.onRenderComponentsDone);

      return this;
    },
    preRender: _.noop,
    postRender: _.noop,
    preRenderComponents: _.noop,
    postRenderComponents: _.noop,
    registerChildView: function (view) {
      // Storage for our subViews.
      this.childViews = this.getChildViews();
      this.childViews.push(view);

      if (view.el) {
        view.parent = view.parentView = this;
      }

      return view;
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

      this.childViews = this.getChildViews();

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
        this.childViews.push(view);
      }, this);

      return this;
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
    trigger: function (channel) {
      if (_.isFunction(this[channel])) {
        this[channel].apply(this, [].slice.call(arguments, 1));
      }

      Backbone.View.prototype.trigger.apply(this, arguments);

      return this;
    },
    // Rendering a collections with individual views.
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

      // store a reference on the view to it's collection views
      // so we can clean up memory references when we're done
      this.registerChildView(views);

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
            view = new ViewClass(_({
              model: model,
              collection: collection
            }).extend(options.viewOptions).value());
            views.push(view);
            view.parent = self;
            view.renderedByParentView = true;
            view.render({
              containerEl: container
            });
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
    destroy: function () {
      // Disposing view hierarchies
      this.removeChildViews();
      // Remove current view out of the DOM and stop listening any events binding through __listenTo__
      this.close();
    },
    getChildViews: function () {
      return this.childViews || [];
    },
    removeChildViews: function () {
      // lodash won't make it work: ` _.chain(this.getChildViews()).flatten().invoke('destroy');`
      _.forEach(_.chain(this.getChildViews()).flatten().value(), function (childView, index) {
        _.invoke([childView], 'destroy');
      });
      // reset `childViews`
      this.childViews = [];

      return this;
    },
    addReferences: function (hash) {
      hash = hash || _.result(this, 'references');

      for (var item in hash) {
        this['$' + item] = this.$(hash[item], this.el);
      }
    }
  });
});
