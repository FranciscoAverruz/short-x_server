const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require("../../config/env.js")

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    scheduledForDeletion: { type: Date, default: null },
    isCancellationPending: { type: Boolean, default: false },
    cancellationRequestedAt: { type: Date, default: null },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null },
    customDomains: [{ type: mongoose.Schema.Types.ObjectId, ref: "CustomDomain" }],
  },
  { timestamps: true }
);

UserSchema.index({ subscription: 1 });

UserSchema.statics.signup = async function (username, email, isAdmin, urls, password, plan, customDomain = null) {
  const exists = await this.findOne({ email });

  if (exists) {
    throw Error('This email address is already registered');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = await this.create({ username, email, isAdmin, urls, password: hash, plan, customDomain });

  return user;
};

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateJWT = async function () {
  try {
    await this.populate('subscription', 'plan');

    const plan = this.subscription ? this.subscription.plan : 'free';

    let payload = {
      id: this._id?.toString(),
      email: this.email || '',
      username: this.username || '',
      isAdmin: this.isAdmin || false,
      plan: plan,  
    };

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET no está definido en las variables de entorno");
    }

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '2d',
    });

  } catch (err) {
    console.error('Error al generar el JWT:', err);
    throw new Error('Error al generar el JWT');
  }
};


module.exports = mongoose.model("User", UserSchema);