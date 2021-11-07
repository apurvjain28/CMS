// importing dependencies
const express = require("express");
const path = require("path");
const { check, validationResult } = require("express-validator");
const session = require("express-session");
const mongoose = require("mongoose");
const fileupload = require("express-fileupload");

// set up db connection
mongoose.connect("mongodb://localhost:27017/cms", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var myApp = express();
myApp.use(express.urlencoded({ extended: false }));

myApp.set("views", path.join(__dirname, "views"));
myApp.use(express.static(__dirname + "/public"));
myApp.set("view engine", "ejs");

myApp.use(fileupload());

myApp.use(
  session({
    secret: "superrandomsecret",
    resave: false,
    saveUninitialized: true,
  })
);

// models
const Admin = mongoose.model("Admin", {
  username: String,
  password: String,
});

const Page = mongoose.model("Page", {
  pageTitle: String,
  pageImageName: String,
  pageDescription: String,
});

// Pages without logging into the page
// User can only read the articles posted by author @Home page
myApp.get("/home", function (req, res) {
  Page.find({}).exec(function (err, pages) {
    res.render("home", { pages: pages });
  });
});

// retrieving pages on home page
myApp.get("/preview/:pageid", function (req, res) {
  // no need of login here as everyone can see all blogs @ home nav
  var pageid = req.params.pageid;
  //console.log(pageid);
  Page.findOne({ _id: pageid }).exec(function (err, page) {
    if (page) {
      res.render("preview", { page: page });
    } else {
      res.send("Page not found");
    }
  });
});

// setting About as opening page
myApp.get("/", function (req, res) {
  Page.findOne({ pageTitle: "About" }).exec(function (err, page) {
    if (page) {
      res.render("preview", { page: page });
    } else {
      res.send("Page not found");
    }
  });
});

myApp.get("/about", function (req, res) {
  // no need of login here as everyone can see About @ About navigation
  Page.findOne({ pageTitle: "About" }).exec(function (err, page) {
    if (page) {
      res.render("preview", { page: page });
    } else {
      res.send("Page not found");
    }
  });
});

myApp.get("/team", function (req, res) {
  // no need of login here as everyone can see Team page @ Team navigation
  Page.findOne({ pageTitle: "Team" }).exec(function (err, page) {
    if (page) {
      res.render("preview", { page: page });
    } else {
      res.send("Page not found");
    }
  });
});

myApp.get("/Contact", function (req, res) {
  // no need of login here as everyone can see Contact @ Contact navigation
  Page.findOne({ pageTitle: "Contact" }).exec(function (err, page) {
    if (page) {
      res.render("preview", { page: page });
    } else {
      res.send("Page not found");
    }
  });
});

// Pages after logging into the page
// After logging in, author can do following task:
// 1. Add pages, which will automatically be added @Home page
//    1a. Store info in db
// 2. Edit all pages, including About, Team, Contact
//    2a. Details like title and description will be fetched from db while editing
// 3. Delete any page, including About, Team, Contact

// login page
myApp.get("/login", function (req, res) {
  res.render("login");
});

myApp.post("/loginsuccess", function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;

  Admin.findOne({ username: user, password: pass }).exec(function (err, admin) {
    if (admin) {
      // store username in session and set logged in true
      req.session.username = admin.username;
      req.session.userLoggedIn = true;

      res.render("loginsuccess", { username: admin.username });
    } else {
      res.render("login", { error: "Incorrect username or password entered" });
    }
  });
});

// logout page
myApp.get("/logoutsuccess", function (req, res) {
  // remove variables from session
  req.session.username = "";
  req.session.userLoggedIn = false;
  res.render("logoutsuccess", { error: "Successfully logged out" });
});

myApp.get("/addpage", function (req, res) {
  if (req.session.userLoggedIn) {
    res.render("addpage");
  } else {
    res.redirect("/login");
  }
});

// myApp.get("/addpagesuccess", function(req,res){
//   res.render('addpagesuccess');
// });

myApp.post(
  "/addpage",
  [
    check("pageTitle", "Please give title to your page").not().isEmpty(),
    check("pageDescription", "Please add description to your page")
      .not()
      .isEmpty(),
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("addpage", {
        err: errors.array(),
      });
    } else {
      var pageTitle = req.body.pageTitle;
      var pageDescription = req.body.pageDescription;

      var pageImageFile = req.files.pageImage;
      var pageImageName = req.files.pageImage.name;

      // console.log({pageTitle,pageDescription,pageImageName});

      var pageImagePath = "public/uploads/" + pageImageName;

      pageImageFile.mv(pageImagePath, function (err) {
        // console.log(err);
      });

      var pageDate = {
        pageTitle: pageTitle,
        pageDescription: pageDescription,
        pageImageName: pageImageName,
      };

      var myPage = new Page(pageDate);
      myPage.save();

      res.render("addpagesuccess");
    }
  }
);

// can edit pages here
myApp.get("/editpage", function (req, res) {
  if (req.session.userLoggedIn) {
    Page.find({}).exec(function (err, pages) {
      res.render("editpage", { pages: pages });
    });
  } else {
    res.redirect("/login");
  }
});

// retrieving page data so that you can edit it
myApp.get("/edit/:pageid", function (req, res) {
  if (req.session.userLoggedIn) {
    var pageid = req.params.pageid;
    Page.findOne({ _id: pageid }).exec(function (err, page) {
      if (page) {
        res.render("edit", { page: page });
      } else {
        res.send("No Page Found");
      }
    });
  } else {
    res.redirect("/login");
  }
});

// posting the edited data again
myApp.post(
  "/edit/:id",
  [
    check("pageTitle", "Please give title to your page").not().isEmpty(),
    check("pageDescription", "Please add description to your page")
      .not()
      .isEmpty(),
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var pageid = req.params.id;
      Page.findOne({ _id: pageid }).exec(function (err, page) {
        if (page) {
          res.render("edit", {
            err: errors.array(),
            page: page,
          });
        } else {
          res.send("Page not found");
        }
      });
    } else {
      var pageTitle = req.body.pageTitle;
      var pageDescription = req.body.pageDescription;

      var pageImageFile = req.files.pageImage;
      var pageImageName = req.files.pageImage.name;

      // console.log({pageTitle,pageDescription,pageImageName});

      var pageImagePath = "public/uploads/" + pageImageName;

      pageImageFile.mv(pageImagePath, function (err) {
        // console.log(err);
      });

      var id = req.params.id;
      Page.findOne({ _id: id }, function (err, page) {
        page.pageTitle = pageTitle;
        page.pageDescription = pageDescription;
        page.pageImageName = pageImageName;
        page.save();
      });
      res.render("editpagesuccess");
    }
  }
);

// can delete pages here
myApp.get("/delete/:pageid", function (req, res) {
  if (req.session.userLoggedIn) {
    var pageid = req.params.pageid;
    Page.findByIdAndDelete({ _id: pageid }).exec(function (err, page) {
      if (page) {
        res.render("deletepagesuccess", { message: "Successfully deleted" });
      } else {
        res.render("deletepagesuccess", { message: "Page not found" });
      }
    });
  } else {
    res.redirect("/login");
  }
});

//start the server
myApp.listen(8000);
console.log("Website at post 8000");
