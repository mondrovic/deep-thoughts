const { User, Thought } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

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

    // returns information about authenticated user
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("thoughts")
          .populate("friends");

        return userData;
      }

      throw new AuthenticationError("Not logged in");
    },
  },

  Mutation: {
    // creates user based on passed in args
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return user;
    },

    // logs into user with specified email and password
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      // checks if user exists
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      // checks if pw is correct
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      return { token, user };
    },

    // adds a thought
    addThought: async (parent, args, context) => {
      // if user is authenticated create a new thought with passed in args
      // username is header.user.username
      if (context.user) {
        const thought = await Thought.create({
          ...args,
          username: context.user.username,
        });

        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { thoughts: thought._id } },
          { new: true }
        );

        return thought;
      }

      throw new AuthenticationError("You need to be logged in!");
    },

    // adds a new reaction
    addReaction: async (parent, { thoughtId, reactionBody }, context) => {
      // if user is authenticated, create a new reaction with args
      // username is header.user.username
      if (context.user) {
        const updatedThought = await Thought.findByIdAndUpdate(
          { _id: thoughtId },
          {
            $push: {
              reactions: { reactionBody, username: context.user.username },
            },
          },
          { new: true, runValidators: true }
        );

        return updatedThought;
      }

      throw new AuthenticationError("You need to be logged in");
    },

    // adds a new friend
    addFriend: async (parent, { friendId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { friends: friendId } },
          { new: true }
        );
      }

      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;
