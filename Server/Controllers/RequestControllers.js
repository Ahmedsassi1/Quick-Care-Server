const { request } = require("express");
const db = require("../Database/index");
const { sendNotification } = require("./Notification");

module.exports = {

  //addding request
  addRequest: async (req, res) => {
    try {
      const filter = {
        email: req.body.email,
      };

      const requestidentif = await db.Patients.findOne({ where: filter });

      const requestForm = {
        description: req.body.description,
        status: req.body.status,
        patientId: requestidentif.id,
        latitude:req.body.latitude,
        longitude:req.body.longitude
      };
      const request = await db.requests.create(requestForm);
      res.status(201).json(request);
    } catch (error) {
      console.log(error);
      res.status(500).json("error");
    }
  },
//getiing all the request
  getAllRequests: async (req, res) => {
    try {
      const requests = await db.requests.findAll({
        where: { status: "Doctor", DoctorId: null },
      });
      res.status(200).json(requests);
    } catch (error) {
      console.log(error);
      res.status(501).json("error");
    }
  },
// get all accepted request by doctor
  getAllOKRequests: async (req, res) => {
    try {
      const requests = await db.requests.findAll({
        where: { status: "Doctor", TreatedORNot: null },
      });
      res.status(200).json(requests);
    } catch (error) {
      console.log(error);
      res.status(501).json(error);
    }
  },
//setting the doctor case as done
  getAllOKDoneRequests: async (req, res) => {
    try {
      const requests = await db.requests.findAll({
        where: { status: "Doctor", TreatedORNot: true },
      });
      res.status(200).json(requests);
    } catch (error) {
      console.log(error);
      res.status(501).json(error);
    }
  },
//actif Hce request waiting for acceptance
  actifRequest: async (req, res) => {
    try {
      const requestId = {
        id: req.body.id,
      };
      const accepted = await db.requests.findOne({ where: requestId });

      if (accepted.hceId == !null) {
        const HceAccept = await db.Hce.findOne({
          where: { id: accepted.hceId },
        });

        const Patient = await db.Patients.findOne({
          where: { id: accepted.patientId },
        });
        sendNotification(Patient.NotifToken);
        res.status(201).json(HceAccept);
      } else {
        res.status(202).json("waiting");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  },

  //getting all th Hce request for the Hce interface
  findHceReq: async (req, res) => {
    try {
      let id = req.params.id;
      const requestHCE = await db.requests.findAll({
        where: { status: "HCE", hceId: id },
        include: [
          {
            model: db.Patients,
            attributes: ["firstName", "lastName", "adress"],
          },
        ],
      });
      console.log(requestHCE);
      res.status(222).json(requestHCE);
    } catch (error) {
      console.log(error);
      res.status(530).send("you have an error");
    }
  },
  //getting all the hce accepted request for the Hce interface
  findActiveHceReq: async (req, res) => {
    try {
      const requestHCE = await db.requests.findAll({
        where: { status: "HCE", hceId: null },
        include: [
          {
            model: db.Patients,
            attributes: ["firstName", "lastName", "adress"],
          },
        ],
      });
      console.log(requestHCE);
      res.status(222).json(requestHCE);
    } catch (error) {
      console.log(error);
      res.status(530).send("you have an error");
    }
  },
  //hce accept request with a notification sent to the patient
  validationHce: async (req, res) => {
    try {
      console.log(req.body.id);
      const request = await db.requests.findOne({
        where: req.body.id,
      });
      request.hceId = req.params.id;
      await request.save();
      const Patient = await db.Patients.findOne({
        where: { id: request.patientId },
      });
      sendNotification(Patient.NotifToken,1);

      res.status(201).json(request);
    } catch (err) {
      console.log(err);
      res.status(501).json(err);
    }
  },
  //getting all the doctor request done by a user in doctor request
  findAllDoctorRequestsOfOneUser: async (req, res) => {
    try {
      const filter = {
        patientId: req.body.id,
        status: "Doctor",
      };

      const requestOfPatient = await db.requests.findAll({
        where: filter,
        include: [
          { model: db.Doctors, attributes: ["firstName", "lastName"] },
        ],
      })
      console.log(requestOfPatient);

      return res.status(222).json(requestOfPatient);
    } catch (error) {
      console.log(error);
      return res.status(530).json("you have error");
    }
  },
  //getting all the hce request done by a user in hce request
  findAllHCERequestsOfOneUser: async (req, res) => {
    try {
      const filter = {
        patientId: req.body.id,
        status: "HCE",
      };

      const requestOfPatient = await db.requests.findAll({
        where: filter,
        include: [
          { model: db.Hce, attributes: ["name"] },
          { model: db.Doctors, attributes: ["firstName", "lastName"] },
        ],
      })

     return res.status(222).json(requestOfPatient);
    } catch (error) {
      console.log(error);
      return res.status(530).json(error);
    }
  },
  //doctor accept the request with a notification sent to the user 
  takeInCharge: async (req, res) => {
    try {
      const request = await db.requests.findOne({
        where: req.body.id,
      });
      request.DoctorId = req.body.doctorId;
      await request.save();
      const Patient = await db.Patients.findOne({
        where: { id: request.patientId },
      });
      console.log(Patient);
      sendNotification(Patient.NotifToken,2);

      res.status(201).json(request);
    } catch (err) {
      console.log(err);
      res.status(501).json(err);
    }
  },
// doctor finish the request for doctor interface
  markAsDone: async (req, res) => {
    try {
      const request = await db.requests.findOne({
        where: req.body.id,
      });
      // const Patient = await db.Patients.findOne({
      //   where: { id: request.patientId },
      // });
      console.log(request);
      request.TreatedORNot = true;
      await request.save();
      res.status(201).json(request);
    } catch (err) {
      console.log(err);
      res.status(501).json(err);
    }
  },
//getting all th actif request for doctor
  
  DoctorActifRequest: async (req, res) => {
    try {
      const requestId = {
        id: req.body.id,
      };
      const accepted = await db.requests.findOne({ where: requestId });
      console.log("aaaaaaaaaaaaaaa",accepted.dataValues.DoctorId);
      if (accepted.dataValues.DoctorId  !== null) {
        const Doctoraccept = await db.Doctors.findOne({
          where: { id: accepted.dataValues.DoctorId  },
        });
        console.log(Doctoraccept)

        // const Patient = await db.Patients.findOne({
        //   where: { id: accepted.patientId },
        // });
        // sendNotification(Patient.NotifToken,2);
        res.status(201).json(Doctoraccept.dataValues);
      } else {
        res.status(202).json("waiting");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  },

  // doctorCallHce : async (req,res)=>{
  //  try {
  //   cons
  //  } catch (error) {

  //  }

  // }
};
