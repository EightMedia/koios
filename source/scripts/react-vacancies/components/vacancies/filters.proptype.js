import PropTypes from "prop-types";

export default PropTypes.arrayOf(
  PropTypes.shape({
    title: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        label: PropTypes.string
      })
    ).isRequired,
    actives: PropTypes.arrayOf(PropTypes.string).isRequired
  })
);
