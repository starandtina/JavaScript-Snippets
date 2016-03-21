 // Use a tagged template to log variables more efficiently.
 function vars(templateStrings, ...substitutions) {
   // Use `templateStrings.raw` template strings: if you don’t want backslashes (\n etc.) to be interpreted
   let result = templateStrings[0];
   for (let [i, obj] of substitutions.entries()) {
     let propKeys = Object.keys(obj);
     for (let [j, propKey] of propKeys.entries()) {
       if (j > 0) {
         result += ', ';
       }
       result += propKey + '=' + obj[propKey];
     }
     result += templateStrings[i + 1];
   }
   return result;
 }


 let foo = 123;
 let bar = 'abc';
 let baz = true;
 console.log(vars `Variables: ${{foo, bar, baz}}`);

 // Output:
 // Variables: foo=123, bar=abc, baz=true
