import { useState, useEffect } from "react";

const useZipcodeAPI = zipcode => {
  const [zipcodeStr, setZipcodeStr] = useState(null); // start empty, it'll be filled by the effect
  const [location, setLocation] = useState({});
  const [loading, setLoading] = useState(false);

  // change zipcodeStr when zipcode is changed to different first 4 chars
  useEffect(() => {
    // fix the input?
    // TODO: check on numbers?
    const str = zipcode.replace(" ", "").substring(0, 4);
    if (str.length >= 4 && str !== zipcodeStr) {
      setZipcodeStr(str);
    } else if (str.length < 4) {
      // reset if user removes part of the zipcode
      setZipcodeStr("");
      setLocation({});
    }
  }, [zipcode]);

  const fetchApi = async () => {
    if (!zipcodeStr) {
      return;
    }
    setLoading(true);
    // nl_fourpp or nl_sixpp
    const res = await fetch(
      `https://api.pro6pp.nl/v1/autocomplete?auth_key=${window.pro6ppApiEndpoint}&nl_fourpp=${zipcodeStr}`
    );
    if (res.ok) {
      const json = await res.json();
      setLocation(json.results[0]);
      setLoading(false);
    }
  };

  // make new api call when zipcodeStr is changed
  // cannot be directly a async function, so wrap it.
  useEffect(() => {
    fetchApi();
  }, [zipcodeStr]);

  return {
    location,
    loading
  };
};

export default useZipcodeAPI;
