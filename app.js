const express = require("express");


const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.static('resources'));
app.use(express.urlencoded({ extended: true }));

app.use("/", require("./routes/index"));

app.listen(port, async () => {
  console.log('Listening on port: ' + port);
})

