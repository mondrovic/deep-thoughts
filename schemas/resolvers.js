const { User, Thought } = require("../models");

const resolvers = {
  Query: {
    // resolves thoughts query. parent is placeholder and won't be used
    // then checks if username. if exists, use the provided username. if not, do normal query
    thoughts: async (parent, { username }) => {
      const params = username ? { username } : {};
      return Thought.find(params).sort({ createdAt: -1 });
    },

    // return single thought based on _id
    thought: async (parent, { _id }) => {
      return Thought.findOne({ _id });
    },

    // returns all users. removes password from query and __v
    // populates friends and thoughts with content rather than _id
    users: async () => {
      return User.find()
        .select("-__v -password")
        .populate("friends")
        .populate("thoughts");
    },

    // searches for single user with username
    user: async (parent, { username }) => {
      return User.findOne({ username })
        .select("-__v -password")
        .populate("friends")
        .populate("thoughts");
    },
  },
};

module.exports = resolvers;
