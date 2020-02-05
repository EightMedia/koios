(function() {
  var support = "content" in document.createElement("template");

  // Set the content property if missing
  if (!support) {
    var /**
       * Prefer an array to a NodeList
       * Otherwise, updating the content property of a node
       * will update the NodeList and we'll loose the nested <template>
       */
      templates = Array.prototype.slice.call(
        document.getElementsByTagName("template")
      ),
      template,
      content,
      fragment,
      node,
      i = 0,
      j;

    // For each <template> element get its content and wrap it in a document fragment
    while ((template = templates[i++])) {
      content = template.children;
      fragment = document.createDocumentFragment();

      for (j = 0; (node = content[j]); j++) {
        fragment.appendChild(node);
      }

      template.content = fragment;
    }
  }
})();