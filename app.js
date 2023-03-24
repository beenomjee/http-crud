const http = require("http");
const fs = require("fs");
const port = process.env.port || 5000;

const urlParamsChecker = (url, yourUrl) => {
  url = url.split("/");
  yourUrl = yourUrl.split("/");
  if (url.length != yourUrl.length) return false;

  for (let i = 0; i < yourUrl.length; i++) {
    if (yourUrl[i].startsWith(":")) continue;
    if (url[i] != yourUrl[i]) return false;
  }
  return true;
};

const urlParametersParser = (url, yourUrl) => {
  url = url.split("/");
  yourUrl = yourUrl.split("/");
  let params = {};

  for (let i = 0; i < yourUrl.length; i++) {
    if (yourUrl[i].startsWith(":")) {
      params[yourUrl[i].slice(1)] = url[i];
    }
  }
  return params;
};

const getUsers = () => {
  return fs.readFileSync("data.json", "utf8");
};

const getUser = (id) => {
  let data = JSON.parse(fs.readFileSync("data.json", "utf8")).find(
    (user) => user.id == id
  );
  data = data ? JSON.stringify(data) : JSON.stringify({});
  return data;
};

const createUser = (data) => {
  let fileData = JSON.parse(fs.readFileSync("data.json", "utf8"));
  data.id = fileData[fileData.length - 1]
    ? fileData[fileData.length - 1].id + 1
    : 1;
  fileData.push(data);
  fs.writeFileSync("data.json", JSON.stringify(fileData));
  return JSON.stringify(data);
};

const deleteUser = (id) => {
  let data = JSON.parse(fs.readFileSync("data.json", "utf8"));
  data = data.filter((user) => user.id != id);
  fs.writeFileSync("data.json", JSON.stringify(data));
  return JSON.stringify({ message: "Successfully deleted" });
};

const updateUser = (id, data) => {
  let index = undefined;
  let fileData = JSON.parse(fs.readFileSync("data.json", "utf8"));
  fileData.find((user, i) => {
    if (user.id == id) index = i;
    return user.id == id;
  });

  if (index === undefined) return createUser(data);
  data.id = id;
  fileData[index] = data;
  fs.writeFileSync("data.json", JSON.stringify(fileData));
  return JSON.stringify(data);
};

const server = (req, res) => {
  const url = req.url;
  const method = req.method.toLowerCase();

  if (urlParamsChecker(url, "/api/users") && method === "get") {
    res.writeHead(200, { "content-type": "application/json" });
    res.write(getUsers());
    res.end();
  } else if (urlParamsChecker(url, "/api/users/:id") && method === "get") {
    let { id } = urlParametersParser(url, "/api/users/:id");
    res.writeHead(200, { "content-type": "application/json" });
    res.write(getUser(id));
    res.end();
  } else if (urlParamsChecker(url, "/api/users") && method === "post") {
    let data = {};
    req.on("data", (chunk) => {
      data = JSON.parse(chunk);
    });
    req.on("end", () => {
      res.writeHead(201, { "content-type": "application/json" });
      res.write(createUser(data));
      res.end();
    });
  } else if (urlParamsChecker(url, "/api/users/:id") && method === "delete") {
    let { id } = urlParametersParser(url, "/api/users/:id");
    res.writeHead(202, { "content-type": "application/json" });
    res.write(deleteUser(id));
    res.end();
  } else if (urlParamsChecker(url, "/api/users/:id") && method === "put") {
    let { id } = urlParametersParser(url, "/api/users/:id");
    res.writeHead(202, { "content-type": "application/json" });
    let data;
    req.on("data", (chunk) => {
      data = JSON.parse(chunk);
    });
    req.on("end", () => {
      res.write(updateUser(id, data));
      res.end();
    });
  } else {
    res.writeHead(404, { "content-type": "application/json" });
    res.write(JSON.stringify({ status: "404 Not Found" }));
    res.end();
  }
};

const httpServer = http.createServer(server);
httpServer.listen(port, (err) => {
  if (err) {
    console.log(err.message);
    return;
  }
  console.log("Server listening on port " + port);
});
