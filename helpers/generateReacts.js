const generateReactsArray = (reactsArray) => {
  const newReacts = reactsArray.reduce((group, react) => {
    let key = react["react"];
    group[key] = group[key] || [];
    group[key].push(react);
    return group;
  }, {});

  const reacts = [
    {
      react: "like",
      count: newReacts.like ? newReacts.like.length : 0,
    },
    {
      react: "love",
      count: newReacts.love ? newReacts.love.length : 0,
    },
    {
      react: "haha",
      count: newReacts.haha ? newReacts.haha.length : 0,
    },
    {
      react: "sad",
      count: newReacts.sad ? newReacts.sad.length : 0,
    },
    {
      react: "wow",
      count: newReacts.wow ? newReacts.wow.length : 0,
    },
    {
      react: "angry",
      count: newReacts.angry ? newReacts.angry.length : 0,
    },
  ];

  return reacts;
};

module.exports = {
  generateReactsArray,
};
