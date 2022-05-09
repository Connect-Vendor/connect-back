const GoogleAuthenication = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const passport = require('passport');
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  if(user) {
      done(null, user)
  }
})


////////////////////////////////////GOOGLE AUTHENTICATION
passport.use(new GoogleAuthenication({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://127.0.0.1:3500/api/v1/auth/google/redirect',
},

    async function (accessToken, refreshToken, profile, done) {
        try {
            //Check if user exist
            const user = await User.findOne({ email: profile._json.email });

            if (user) {
                return done(null, user);
            }

            //Create user if user dose not exist
            const newUser = await User.create({
                email: profile._json.email,
                first_name: profile._json.name.split(' ')[0],
                last_name: profile._json.name.split(' ')[1],
                photo: profile._json.picture,
            })

            return done(null, newUser);
        } catch (error) {
            console.log('Error',error);
        }
    }
))


////////////////////////////////////////FACEBOOK AUTHENTICATION
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://127.0.0.1:3500/api/v1/auth/facebook/redirect"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
  }
));