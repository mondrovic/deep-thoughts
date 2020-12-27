const express = require("express");
// import typedefs and resolvers
const { ApolloServer } = require("apollo-server-express");
const { typeDefs, resolvers } = require("./schemas");
const { authMiddleware } = require("./utils/auth");
const db = require("./config/connection");
const path = require("path");

const PORT = process.env.PORT || 3001;
const app = express();

// create new apollo server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

// integrate Apollo server with express
server.applyMiddleware({ app });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build/")));
}

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

db.once("open", () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    // log where we can test GQL
    console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
  });
});
