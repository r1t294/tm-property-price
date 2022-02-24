const puppeteer = require('puppeteer');

// Search stages to reduce the number of searches.
const stageMap = {
  's1': 500000,
  's2': 300000,
  's3': 100000,
  's4': 50000,
  's5': 10000,
  's6': 5000,
  's7': 1000
}
var finalPrice = 0;
var property_address = '';

// main page view
const mainView = (req, res) => {
  if (req.query.valid == "noUrl") {
    res.render("search", { alert: "Please enter a URL" });
  } else {
    res.render("search", { alert: false });
  }
};

const propertyView = (req, res) => {
  res.render("property")
};

const loadingView = (req, res) => {
  res.render("loading_page")
};

//main search function
const mainSearchFunction = async (req, res) => {

  const { property_url, resolution } = req.body;
  //---------------------------------------------------------------
  console.log("Selected Resolution: " + getResolution(resolution));
  //---------------------------------------------------------------

  if (!property_url) {
    return res.redirect("/?valid=noUrl");
  } else {
    var urlSegments = property_url.split('/');
    var propertyID = urlSegments[urlSegments.length - 1]
    var propertyType = urlSegments[5];
    var searchUrl = "https://www.trademe.co.nz/a/property/" + propertyType + "/search?search_string=" + propertyID + "*";
    console.time("Time Taken");
    finalPrice = await findProperty(property_url, searchUrl, resolution);
    console.timeEnd("Time Taken");

    if (finalPrice == 0) {
      return res.render("search", { alert: "Something went wrong, Please check URL" });
    } else {
      finalPrice = "$" + new Intl.NumberFormat('en-NZ', { style: 'decimal' }).format(finalPrice);
      return res.render('property', { price: finalPrice, address: property_address, listing_url: property_url });
    }
  }

};

async function findProperty(propertyUrl, searchUrl, priceResolution) {
  var i = 0;
  var noResult = 0;
  var gotResult = false;
  var price = 0; // Minumum price for starting search
  var prevPrice = 0;
  var adjustedSearchUrl = searchUrl + "&price_min=" + price;
  var recentAdjust = true;
  var currentStage = stageMap['s1'];
  finalPrice = 0;
  const browser = await puppeteer.launch();

  // Just obtaining the address here.
  const page = await browser.newPage();

  try { // Save Page Title (Address) & Catch errors in provided URL.
    await page.goto(propertyUrl);
    property_address = await page.title();
    await page.close();
  } catch (err) {
    await page.close();
    await browser.close();
    return 0;
  }


  // Main logic
  while (!gotResult) { // While we don't have the final price...
    //------------------------
    console.log(noResult);
    //------------------------
    if (noResult == 1) {
      recentAdjust = true;
      price += stageMap['s2'];
      currentStage = stageMap['s2'];
    } if (noResult == 2) {
      recentAdjust = true;
      price += stageMap['s3'];
      currentStage = stageMap['s3'];
    } if (noResult == 3) {
      recentAdjust = true;
      price += stageMap['s4'];
      currentStage = stageMap['s4'];
    } if (noResult == 4 && priceResolution != 0) {
      recentAdjust = true;
      price += stageMap['s5'];
      currentStage = stageMap['s5'];
    } else if (noResult == 4 && priceResolution == 0) {
      gotResult = true;
    }
    if (noResult == 5 && priceResolution != 1) {
      recentAdjust = true;
      price += stageMap['s6'];
      currentStage = stageMap['s6'];
    } else if (noResult == 5 && priceResolution == 1) {
      gotResult = true;
    }
    if (noResult == 6 && priceResolution != 2) {
      recentAdjust = true;
      price += stageMap['s7'];
      currentStage = stageMap['s7'];
    } else if (noResult == 6 && priceResolution == 2) {
      gotResult = true;
    }
    if (noResult == 7 && priceResolution == 3) {
      gotResult = true;
    }

    if (!recentAdjust) { //if not recently adjusted - add currentStage value.
      price += currentStage;
    }
    recentAdjust = false;

    adjustedSearchUrl = searchUrl + "&price_min=" + price;
    //-------------------------------------
    console.log(adjustedSearchUrl + "\n");
    //-------------------------------------
    const page = await browser.newPage();
    await page.goto(adjustedSearchUrl);
    const result = (await page.content()).includes("Showing 0 results");
    await page.close();

    if (result && i == 0) {
      await browser.close();
      return 0;
    }

    if (result) {
      noResult++;
      price = prevPrice;
      //-------------------------
      console.log("Property not found\n");
      //-------------------------
    } else {
      prevPrice = price;
      //-------------------------
      console.log("Property found\n");
      //-------------------------
    }
    i++;
  }
  //-----------------------------------------------------------------------------------------------------
  console.log("Final Price: " + price + " : Result = " + getResolution(priceResolution) + " Resolution");
  //-----------------------------------------------------------------------------------------------------
  await browser.close();
  return price;
}

function getResolution(selectedRes) {
  var resolutionMap = {
    "0": "50K",
    "1": "10K",
    "2": "5K",
    "3": "1K"
  };
  return resolutionMap[selectedRes];
}


module.exports = {
  mainView,
  propertyView,
  loadingView,
  mainSearchFunction,
};