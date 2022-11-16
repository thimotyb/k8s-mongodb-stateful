rs.initiate(
   {
      _id: "rs0",
      version: 1,
      members: [
         { _id: 0, host : "192.168.1.3:27017" },
         { _id: 1, host : "192.168.0.6:27017" },
         { _id: 2, host : "192.168.1.4:27017" }
      ]
   }
)
