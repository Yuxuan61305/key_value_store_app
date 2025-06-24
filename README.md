# key_value_store_app

This is a simple email/password authentication web app that allows users to store key/value string pairs
and to look them up. It stores the data in a mongodb database and we used chatgpt to build this app with multiple prompts 
including the following:

1st Prompt:
I want to create a node.js express app implementing a key value store for strings. It should use email and password authentication. It should allow user to store a key value pair or look up the key value for a key. Make this app as simple as possible to understand. Use ejs for the view. Don't use any client side javascript. We also want to use this to connect with react-native mobile apps

2: persist data with MongoDb Database

3: Monify this to store MongoDb connection in a dot env file

4: Could you create a zip file containing all these files for me?

5: You are storing the password in plain text, edit it so it will be encrypted strongly


6:
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  store: {
    type: Map,
    of: String,
    default: {}
  }
});

module.exports = mongoose.model('User', userSchema);

How could you only display the key value pairs  that user has stored


7: When deploying to render.com, it creates an error how do I start the server withought specifying a port



