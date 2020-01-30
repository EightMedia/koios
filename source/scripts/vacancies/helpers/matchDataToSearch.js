import Fuse from "fuse.js";

const options = {
  keys: [
    {
      name: "name",
      weight: 0.7
    },
    {
      name: "description",
      weight: 0.3
    },
    {
      name: "branches.label",
      weight: 0.5
    }
  ],
  // includeScore: true,
  threshold: 0.35,
  shouldSort: true, // make sure the best match is on top
  maxPatternLength: 32,
  minMatchCharLength: 1
};

const matchDataToSearch = data => searchString => {
  if (!searchString) {
    return data;
  }

  const fuse = new Fuse(data, options);
  return fuse.search(searchString);
};

export default matchDataToSearch;
