//Controller related to HCE ressource.
const db = require("../Database/index");
const bcrypt = require("bcrypt");
const { sendConfirmationMail } = require("./nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  //adding a Hce
  addHce: async (req, res) => {
    const characters =
      "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let activationCode = "";
    for (let i = 0; i <= 6; i++) {
      activationCode +=
        characters[Math.floor(Math.random() * characters.length)];
    }
    let newHce = {
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      phoneNumber: req.body.phoneNumber,
      adress: req.body.address,
      licenseNumber: req.body.licenseNumber,
      activationCode: activationCode,
    };
    // console.log(newHce);
    try {
      console.log("try block");
      const nodemailerResponse = await sendConfirmationMail(
        newHce.email,
        activationCode
      );
      console.log(nodemailerResponse);

      const hce = await db.Hce.create(newHce);
      res.status(203).send("registred");
    } catch (error) {
      console.log("catch block");
      console.log(error);
      res.status(555).send(error);
    }
  },
  //verifying account with the node mailer code  
  verifyCode: async (req, res) => {
    try {
      let filter = { activationCode: req.body.activationCode };
      const hce = await db.Hce.findOne({ where: filter });
      if (hce) {
        return res.status(200).send({message:"allowed", infos:hce});
      }
      res.status(402).send("wrong code");
    } catch (error) {
      res.status(400).send(error);
    }
  },

  //Hce login 
  hceAuthentification: async (req, res) => {
    try {
      let filter = {
        email: req.body.email,
      };
      console.log(req.body);
      const Hce = await db.Hce.findOne({ where: filter });
      console.log(Hce);
      if (!Hce) {
        return res.status(401).json("check you email address");
      }
      const Valid = bcrypt.compareSync(req.body.password, Hce.password);
      if (!Valid) {
        return res.status(402).json("wrong password");
      } else {
        const exp = Date.now() + 1000 * 60 * 60;
        const token = jwt.sign({ sub: Hce.id, exp }, process.env.SECRET_KEY);
        res.cookie("Authorization", token, {
          expires: new Date(exp),
          httpOnly: true,
          sameSite: "lax",
        });
        console.log(res);
        console.log("token", token);
      return   res.status(202).send(Hce);
      }
    } catch (error) {
      console.log(error);
      res.status(401).json(error);
    }
  },

//getting one Hce info
  gettingOneHce: async (req, res) => {
    try {
      let filter = {
        email: req.body.email,
      };
      const Hce = await db.Hce.findOne({ where: filter });
      res.status(200).json(Hce);
    } catch (error) {
      console.log(error);
      res.status(400).send("error");
    }
  },
  //logout for Hce
  logout : async (req, res) => {
    try {
      res.clearCookie("Authorization");
      return res.status(200).json({ message: "logged out" });
    } catch (err) {
      console.log(err);
      return  res.status(401).json(err);
    }
  }
};
