const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.Signup = async (req, res) => {
  try {
    const { first_name, last_name, password, email } = req.body;

    if (!first_name || !last_name || !password || !email)
      return res.status(200).json({
        code: 'E01',
        status: false,
        message: `Please provide ${first_name ? '' : 'First name /'} ${
          last_name ? '' : 'Last name /'
        } ${password ? '' : 'Password /'} ${email ? '' : 'Email'}`,
      });

    //Check if user email already exist
    const isUser = await User.findOne({ email });
    if (isUser)
      return res.status(200).json({
        code: 'E00',
        status: false,
        message: 'User Email Already Exist',
      });

    //Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    //Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      password: passwordHash,
    });

    //Send Email

    //create token
    const token = jwt.sign({ user }, process.env.JWT_PKEY, {
      expiresIn: process.env.JWT_EXPIRATION,
    });
    // console.log(token);
    console.log(process.env.JWT_COOKIE_EXPIRES_IN);
    //Send cookie
    const cookieOpt = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      secure: false,
      sameSite: 'strict',
      httpOnly: true,
    };

    res.cookie('auth', token, cookieOpt);

    res.status(200).json({
      code: '00',
      token,
      status: true,
      message: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 'E500',
      status: false,
      message: 'Oops! something went wrong',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Check if email and password is correct
    if (!email || !password)
      return res.status(200).json({
        code: 'E00',
        status: false,
        message: 'Please provide email or password',
      });

    //check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    // console.log(user);
    if (!user || !(await user.isPasswordCorrect(password, user.password)))
      return res.status(401).json({
        code: 'E401',
        status: false,
        message: 'Incorrect email or password',
      });

    //send jwt if user exist and password correct
    //create token
    const token = jwt.sign({ user }, process.env.JWT_PKEY, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    //Send cookie
    const cookieOpt = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      secure: false,
      sameSite: 'strict',
      httpOnly: true,
    };

    res.cookie('auth', token, cookieOpt);

    res.status(200).json({
      code: '00',
      token,
      status: true,
      message: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 'E500',
      status: false,
      message: 'Oops! somthing went wrong',
    });
  }
};
