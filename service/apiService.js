const apiUtil = require("../util/apiUtil");
const componets = require("../repository/components_repository");
const dataFetch = require("./data_fetch");
const dataClean = require("./data_clean");
const e = require("cors");

const dataRepo = require("../repository/result_repository");

const filterDataMap = new Map();
filterDataMap.set("Mouser", dataClean.cleanMouser);
// filterDataMap.set("Element14", dataClean.cleanElements);
filterDataMap.set("Rutronik", dataClean.cleanRutronik);
filterDataMap.set("Texas Instruments", dataClean.cleanTexas);
// filterDataMap.set("DigiKey", dataClean.cleanDigiKey);
filterDataMap.set("TME", dataClean.cleanTME);
filterDataMap.set("Verical", dataClean.cleanVerical);

const filterData = (
  quantity,
  partNumber,
  mpn,
  priceBreak,
  distributer,
  availability,
  descr,
  manufacturer,
  moq,
  spq,
  currency,
  convert_from_eur,
  convert_from_usd,
  lead
) => {
  // If quantity is greater than MOQ and Less than available Stocks
  if (quantity >= moq && quantity <= availability) {
    try {
      const val = filterDataMap.get(distributer)(
        mpn,
        quantity,
        priceBreak,
        spq,
        manufacturer,
        availability,
        descr,
        currency,
        distributer,
        convert_from_eur,
        convert_from_usd,
        lead
      );
      return val;
    } catch (error) {
      console.log(`Error in clean${distributer} cleanDataFunction : `, error);
    }
  } else if (quantity > availability) {
    // Quantity greater than stocks
    const priceBreak = [
      {
        Quantity: `Insufficient Stock`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];

    return apiUtil.createResultObj(
      mpn,
      distributer,
      availability,
      descr,
      priceBreak,
      manufacturer
    );
  } else if (quantity < moq) {
    // Min quota not met
    console.log("min quota not met");
    const priceBreak = [
      {
        Quantity: `Min. ${parseInt(moq)} Req.`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];
    return apiUtil.createResultObj(
      mpn,
      distributer,
      availability,
      descr,
      priceBreak,
      manufacturer
    );
  } else {
    console.log(`Some issue in ${distributer}`);
  }
};

// const filterDataSPQ = ()

// Gives the correct spq price for E14
const specialFilter = (quantity, mpn, value, manufacturer) => {
  // Sorting Data based on Descending order of SPQ

  // Need to implement -> If same spq is found, sort by price value.
  // value.sort((a,b) => b.translatedMinimumOrderQuality - a.translatedMinimumOrderQuality);

  value.sort((a, b) => {
    if (b.prices[0].from !== a.prices[0].from) {
      return b.prices[0].from - a.prices[0].from;
    } else {
      // If .prices[0].from values are equal, compare by the least price
      const leastPriceA =
        a.prices && a.prices.length > 0 ? a.prices[0].cost : Infinity;
      const leastPriceB =
        b.prices && b.prices.length > 0 ? b.prices[0].cost : Infinity;

      return leastPriceA - leastPriceB;
    }
  });

  // console.log("Original value = ",value);
  const min_spq = value[value.length - 1].prices[0].from;
  // console.log("min spq = ",min_spq);

  if (min_spq === undefined) {
    min_spq = 1;
  }

  if (quantity < min_spq) {
    // console.log("min quota not met for E14");
    const priceBreak = [
      {
        Quantity: `Min. ${parseInt(min_spq)} Req.`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];
    // For availability, we can find the max_availability in the data
    return apiUtil.createResultObj(
      mpn,
      distributer,
      "Na",
      descr,
      priceBreak,
      manufacturer
    );
  }

  const remainder_ = quantity % min_spq;
  let new_adjusted_quantity = quantity;

  // Check if the quantity is not already a multiple of SPQ
  if (remainder_ > 0) {
    // Adjusting to next higher multiple of spq
    new_adjusted_quantity = new_adjusted_quantity - remainder_ + min_spq;
  }

  // console.log("prev quantity : ",quantity);
  // console.log("new quantity : ",new_adjusted_quantity);

  let remainingQuantity = new_adjusted_quantity;
  let totalCost = 0;
  let prevPCQ = 0;

  let max_availability = 0;

  for (const data of value) {
    const availability = parseInt(data.stock.level) || 0;
    max_availability = Math.max(max_availability, availability);

    if (availability < new_adjusted_quantity) {
      continue;
    }

    const priceBreak = data.prices;
    const spq = data.prices[0].from;

    // console.log("spq = ",spq);
    // console.log("PriceBreak = ",priceBreak);

    if (remainingQuantity > 0) {
      const priceCalculateQuantity = Math.floor(remainingQuantity / spq) * spq;
      prevPCQ = priceCalculateQuantity;

      remainingQuantity = remainingQuantity % spq;

      // console.log("priceCalculateQuantity : ",priceCalculateQuantity);
      // console.log("remainingQuantity : ",remainingQuantity);

      let cost_ = 0;

      if (priceCalculateQuantity === 0) {
        continue;
      }

      for (let i = 0; i < priceBreak.length; i++) {
        if (priceCalculateQuantity < parseInt(priceBreak[i].from)) {
          try {
            cost_ = parseFloat(
              (priceCalculateQuantity * priceBreak[i - 1].cost).toFixed(2)
            );
          } catch (error) {
            console.log("Error of priceCalculateQuantity < SPQ");
            cost_ = parseFloat((priceBreak[0].cost * spq).toFixed(2));
            remainingQuantity = 0;
          }
          break;
        }
      }

      if (cost_ === 0) {
        const lastPrice = priceBreak[priceBreak.length - 1].cost;
        cost_ = parseFloat((priceCalculateQuantity * lastPrice).toFixed(2));
      }

      // console.log("cost = ",cost_);
      totalCost += cost_;
    }
  }

  // console.log("Total cost = ",totalCost);
  const distributer = "Element14";
  const descr = value[0].displayName;

  if (totalCost === 0) {
    const priceBreak = [
      {
        Quantity: `Insufficient Stock`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: "INR",
      },
    ];

    return apiUtil.createResultObj(
      mpn,
      distributer,
      max_availability,
      descr,
      priceBreak,
      manufacturer
    );
  }

  const priceVal = [
    {
      Quantity: new_adjusted_quantity,
      Price: totalCost,
      Unit_Price: parseFloat(totalCost / new_adjusted_quantity).toFixed(3),
      Currency: "INR",
    },
  ];

  return apiUtil.createResultObj(
    mpn,
    distributer,
    max_availability,
    descr,
    priceVal,
    manufacturer
  );
};

const DigikeySpecialFilter = (
  quantity,
  mpn,
  value,
  manufacturer,
  descr,
  distributer,
  currency
) => {
  // console.log("mpn = ",mpn);
  // console.log("value = ",value);
  // console.log("manufacturer = ",manufacturer);
  // console.log("************");

  // Descending order of SPQ
  value.sort((a, b) => {
    if (
      b.StandardPricing[0].BreakQuantity !== a.StandardPricing[0].BreakQuantity
    ) {
      return (
        b.StandardPricing[0].BreakQuantity - a.StandardPricing[0].BreakQuantity
      );
    } else {
      const leastPriceA =
        a.StandardPricing && a.StandardPricing.length > 0
          ? a.StandardPricing[0].BreakQuantity
          : Infinity;
      const leastPriceB =
        b.StandardPricing && b.StandardPricing.length > 0
          ? b.StandardPricing[0].BreakQuantity
          : Infinity;

      return leastPriceA - leastPriceB;
    }
  });

  // console.log("value = ",value);
  // console.log("************");

  const min_spq = value[value.length - 1].StandardPricing[0].BreakQuantity;
  // console.log("min spq = ",min_spq);

  if (quantity < min_spq) {
    // console.log("min quota not met for DigiKey");
    const priceBreak = [
      {
        Quantity: `Min. ${parseInt(min_spq)} Req.`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];
    // For availability, we can find the max_availability in the data
    return apiUtil.createResultObj(
      mpn,
      distributer,
      "Na",
      descr,
      priceBreak,
      manufacturer
    );
  }

  if (min_spq === undefined) {
    min_spq = 1;
  }

  const remainder_ = quantity % min_spq;
  let new_adjusted_quantity = quantity;

  // Check if the quantity is not already a multiple of SPQ
  if (remainder_ > 0) {
    // Adjusting to next higher multiple of spq
    new_adjusted_quantity = new_adjusted_quantity - remainder_ + min_spq;
  }

  // console.log("prev quantity : ",quantity);
  // console.log("new quantity : ",new_adjusted_quantity);

  let remainingQuantity = new_adjusted_quantity;
  let totalCost = 0;
  let prevPCQ = 0;

  let max_availability = 0;

  for (const data of value) {
    const availability = data.QuantityAvailableforPackageType;
    max_availability = Math.max(max_availability, availability);

    if (availability < new_adjusted_quantity) {
      continue;
    }

    const priceBreak = data.StandardPricing;
    const spq = data.StandardPricing[0].BreakQuantity;

    if (remainingQuantity > 0) {
      const priceCalculateQuantity = Math.floor(remainingQuantity / spq) * spq;
      prevPCQ = priceCalculateQuantity;

      remainingQuantity = remainingQuantity % spq;

      // console.log("priceCalculateQuantity = ", priceCalculateQuantity);
      // console.log("remainingQuantity = ",remainingQuantity);

      let cost_ = 0;

      if (priceCalculateQuantity === 0) {
        continue;
      }

      for (let i = 0; i < priceBreak.length; i++) {
        if (priceCalculateQuantity < parseInt(priceBreak[i].BreakQuantity)) {
          try {
            cost_ = parseFloat(
              (priceCalculateQuantity * priceBreak[i - 1].UnitPrice).toFixed(2)
            );
          } catch (error) {
            console.log("Error of priceCalculateQuantity < SPQ");
            cost_ = parseFloat((priceBreak[0].UnitPrice * spq).toFixed(2));
            remainingQuantity = 0;
          }
          break;
        }
      }

      if (cost_ === 0) {
        const lastPrice = priceBreak[priceBreak.length - 1].UnitPrice;
        cost_ = parseFloat((priceCalculateQuantity * lastPrice).toFixed(2));
      }

      console.log("cost = ", cost_);
      totalCost += cost_;
    }
  }
  // console.log("Total cost = ",totalCost);

  if (totalCost === 0) {
    const priceBreak = [
      {
        Quantity: `Insufficient Stock`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];

    return apiUtil.createResultObj(
      mpn,
      distributer,
      max_availability,
      descr,
      priceBreak,
      manufacturer
    );
  }

  const priceVal = [
    {
      Quantity: new_adjusted_quantity,
      Price: totalCost,
      Unit_Price: parseFloat(totalCost / new_adjusted_quantity).toFixed(3),
      Currency: "INR",
    },
  ];

  return apiUtil.createResultObj(
    mpn,
    distributer,
    max_availability,
    descr,
    priceVal,
    manufacturer
  );
};

// const vericalFilter = (quantity, partNumberVal, mpn, priceBreak, distributer, availability, descr, manufacturer, moq, spq, currency) => {
//   console.log("________Verical FIlter________");
//   console.log("mpn = ",mpn);
//   console.log("SPQ = ",spq);
//   console.log("priceBreak = ",priceBreak);
//   console.log("distributer = ",distributer);
//   console.log("availability = ",availability);
//   console.log("manufacturer = ",manufacturer);

// }

const arrowFilter = (
  quantity,
  partNumberVal,
  mpn,
  value,
  distributer,
  descr,
  manufacturer,
  currency
) => {
  console.log("________Arrow FIlter________");
  console.log("mpn = ", mpn);
  console.log("distributer = ", distributer);
  console.log("manufacturer = ", manufacturer);
  console.log("value = ", value);

  let totalPCQ = 0;

  // Ordering by SPQ in descending order
  value.sort((a, b) => {
    return b.packSize - a.packSize;
  });

  const min_spq = value[value.length - 1].packSize;

  if (quantity < min_spq) {
    const priceBreak = [
      {
        Quantity: `Min. ${parseInt(min_spq)} Req.`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];
    // For availability, we can find the max_availability in the data
    return apiUtil.createResultObj(
      mpn,
      distributer,
      "Na",
      descr,
      priceBreak,
      manufacturer
    );
  }

  if (min_spq === undefined) {
    min_spq = 1;
  }

  const remainder_ = quantity % min_spq;
  let new_adjusted_quantity = quantity;

  // Check if the quantity is not already a multiple of SPQ
  if (remainder_ > 0) {
    // Adjusting to next higher multiple of spq
    new_adjusted_quantity = new_adjusted_quantity - remainder_ + min_spq;
  }

  let remainingQuantity = new_adjusted_quantity;
  let totalCost = 0;
  let prevPCQ = 0;
  let max_availability = 0;

  const pcqMap = new Map();

  for (let i = 0; i < value.length; i++) {
    const availability = value[i]?.Availability[0]?.fohQty || 0;
    max_availability = Math.max(max_availability, availability);

    // Got to the next lower moq, spq value[i] if stock is not there
    if (availability < new_adjusted_quantity) {
      continue;
    }

    const priceBreak = value[i].Prices.resaleList;
    const spq = value[i].packSize;

    if (remainingQuantity > 0) {
      const priceCalculateQuantity = Math.floor(remainingQuantity / spq) * spq;

      remainingQuantity = remainingQuantity % spq;

      let cost_ = 0;

      if (priceCalculateQuantity === 0) {
        continue;
      }

      let moqFlag = true;

      for (let i = 0; i < priceBreak.length; i++) {
        console.log(
          "parseInt(priceBreak[i].minQty) = ",
          parseInt(priceBreak[i].minQty)
        );
        console.log("priceBreak[i].UnitPrice = ", priceBreak[i].price);
        console.log("priceCalculateQuantity = ", priceCalculateQuantity);
        if (priceCalculateQuantity < parseInt(priceBreak[i].minQty)) {
          try {
            cost_ = parseFloat(
              (priceCalculateQuantity * priceBreak[i - 1].price).toFixed(2)
            );
            console.log("Calculated cost per iteration = ", cost_);
          } catch (error) {
            // Results in a type error, since priceBreak of i-1 is undefined
            console.log("Error of priceCalculateQuantity < moq");
            moqFlag = false; // Means that the quantity is less than the moq of the prieBreak list
            // cost_ = parseFloat((priceBreak[0].UnitPrice * spq).toFixed(2));
            // remainingQuantity = 0;
          }
          break; // This priceBreak's use is over. Now go over to the next lower spq priceBreak
        }
      }

      if (moqFlag) {
        pcqMap.set(i, priceCalculateQuantity);
        totalPCQ += priceCalculateQuantity;
      }

      // moqFlag being False means that the quantity is greater than the priceBreak quantity of the priceBreak list. Therefore, we can use the last priceBreak price to calculate for our quantity
      if (cost_ === 0 && moqFlag) {
        const lastPrice = priceBreak[priceBreak.length - 1].price;
        cost_ = parseFloat((priceCalculateQuantity * lastPrice).toFixed(2));
        console.log("Cost inside 0 per iteration = ", cost_);
      }

      console.log("cost = ", cost_);
      totalCost += cost_;
    }
  }

  if (totalCost === 0) {
    const priceBreak = [
      {
        Quantity: `Insufficient Stock`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];

    return apiUtil.createResultObj(
      mpn,
      distributer,
      max_availability,
      descr,
      priceBreak,
      manufacturer
    );
  }

  // Stock issue was there. Now, go from the lower spq to the higher spq and calculate the new Quantity on the go
  if (remainingQuantity > 0) {
    for (let i = value.length - 1; i >= 0; i--) {
      console.log("remainingQuantity = ", remainingQuantity);
      const availability = value[i]?.Availability[0]?.fohQty || 0;
      const spq = value[i].packSize;
      let rem = remainingQuantity % spq;
      let new_adjusted_quantity_ = remainingQuantity;

      if (rem > 0) {
        // Adjusting to next higher multiple of spq
        remainingQuantity =
          remainingQuantity - rem + spq + (pcqMap.get(i) ?? 0);
      }
      // let remainingQuantity = new_adjusted_quantity_;
      console.log("remainingQuantity = ", remainingQuantity);
      console.log("new_adjusted_quantity_ = ", new_adjusted_quantity_);

      const prev_adjusted_quantity = pcqMap.get(i) ?? 0;
      console.log("prev_adjusted_quantity = ", prev_adjusted_quantity);

      // It checks if the previously calculated quantity + the new spq logic's quantity are well within the stock availability
      if (availability < new_adjusted_quantity_) {
        continue;
      }

      const priceBreak = value[i].Prices.resaleList;

      if (remainingQuantity > 0) {
        const priceCalculateQuantity =
          Math.floor(remainingQuantity / spq) * spq;

        remainingQuantity = remainingQuantity % spq; // remainingQuantity becomes 0 at this point

        let cost_ = 0;

        if (priceCalculateQuantity === 0) {
          continue;
        }
        let moqFlag = true;

        for (let i = 0; i < priceBreak.length; i++) {
          if (prev_adjusted_quantity < parseInt(priceBreak[i].minQty)) {
            try {
              cost_ = parseFloat(
                (prev_adjusted_quantity * priceBreak[i - 1].price).toFixed(2)
              );
              totalPCQ -= prev_adjusted_quantity;

              totalCost -= cost_;

              // totalPCQ -= prev_adjusted_quantity;
            } catch (error) {
              // Results in a type error, since priceBreak of i-1 is undefined
              console.log("Error of priceCalculateQuantity < moq");
              moqFlag = false; // Means that the quantity is less than the moq of the prieBreak list
              // cost_ = parseFloat((priceBreak[0].UnitPrice * spq).toFixed(2));
              // remainingQuantity = 0;
            }
            break; // This priceBreak's use is over. Now go over to the next lower spq priceBreak
          }
        }

        for (let i = 0; i < priceBreak.length; i++) {
          if (priceCalculateQuantity < parseInt(priceBreak[i].minQty)) {
            try {
              cost_ = parseFloat(
                (priceCalculateQuantity * priceBreak[i - 1].price).toFixed(2)
              );
              totalPCQ += priceCalculateQuantity;
            } catch (error) {
              // Results in a type error, since priceBreak of i-1 is undefined
              console.log("Error of priceCalculateQuantity < moq");
              moqFlag = false; // Means that the quantity is less than the moq of the prieBreak list
              // cost_ = parseFloat((priceBreak[0].UnitPrice * spq).toFixed(2));
              // remainingQuantity = 0;
            }
            break; // This priceBreak's use is over. Now go over to the next lower spq priceBreak
          }
        }

        // if (moqFlag) {
        //   totalPCQ += priceCalculateQuantity;
        // }

        if (cost_ === 0 && moqFlag) {
          const lastPrice = priceBreak[priceBreak.length - 1].price;
          cost_ = parseFloat((priceCalculateQuantity * lastPrice).toFixed(2));
        }

        console.log(" new cost = ", cost_);
        totalCost += cost_;
      }
    }
  }

  if (remainingQuantity > 0) {
    console.log("Quantity remaining = ", remainingQuantity);
    const priceBreak = [
      {
        Quantity: `Insufficient Stock`,
        Price: "NaN",
        Unit_Price: "NaN",
        Currency: currency,
      },
    ];

    return apiUtil.createResultObj(
      mpn,
      distributer,
      max_availability,
      descr,
      priceBreak,
      manufacturer
    );

  }

  console.log("Final total cost = ", totalCost);
  console.log("Final total quantity = ", totalPCQ);

  const priceVal = [
    {
      Quantity: totalPCQ,
      Price: totalCost,
      Unit_Price: parseFloat(totalCost / totalPCQ).toFixed(3),
      Currency: "INR",
    },
  ];

  return apiUtil.createResultObj(
    mpn,
    distributer,
    max_availability,
    descr,
    priceVal,
    manufacturer
  );
};

// Function to map the data to be cleaned to the correct distributer Function
const cleanDataFunction = async (
  data,
  index,
  quantity,
  partNumberVal,
  conversion_from_usd,
  conversion_from_eur
) => {
  const result = [];
  const mapByManufacturers = new Map();

  switch (index) {
    case "Mouser":
      // console.log("Data from mouser : ",data);
      for (let i = 0; i < data.SearchResults.NumberOfResult; i++) {
        const responseData = data.SearchResults.Parts[i];
        const mpn = responseData?.ManufacturerPartNumber;

        try {
          const distributer = "Mouser";
          const availability = parseInt(responseData?.AvailabilityInStock || 0);
          const descr = responseData?.Description || "NA";
          const currency = "INR";
          const manufacturer = responseData?.Manufacturer || "NA";
          const moq = parseInt(responseData?.Min) || 1;
          const priceBreak = responseData?.PriceBreaks;
          const spq = parseInt(responseData?.Mult) || 1;
          const lead = parseInt(responseData?.LeadTime.slice(0, -5)); // Removing " Days" and converting to Integer
          // console.log("Lead = ",lead)

          if (!apiUtil.matchString(String(partNumberVal), mpn)) {
            continue;
          }
          result.push(
            filterData(
              quantity,
              partNumberVal,
              mpn,
              priceBreak,
              distributer,
              availability,
              descr,
              manufacturer,
              moq,
              spq,
              currency,
              NaN,
              NaN,
              lead
            )
          );
        } catch (error) {
          console.log(`Error in mouser for ${mpn} - `, error);
        }
      }
      // console.log("Cleaned mouser data : ",result);
      return result;

    case "Element14":
      for (
        let i = 0;
        i < data.manufacturerPartNumberSearchReturn?.numberOfResults;
        i++
      ) {
        const responseData =
          data.manufacturerPartNumberSearchReturn.products[i];
        const distributer = "Element14";
        const availability = parseInt(responseData.stock.level) || 0;
        const descr = responseData.displayName;
        const currency = "INR";
        const manufacturer = responseData.vendorName;
        const moq = parseInt(responseData.translatedMinimumOrderQuality);
        const mpn = responseData.translatedManufacturerPartNumber;
        const priceBreak = responseData.prices;
        const reelingFlag = responseData.reeling;
        const sku = apiUtil.processSKU(responseData.sku);
        const spq = responseData.prices[0].from;
        // const lead =

        if (!apiUtil.matchString(String(partNumberVal), mpn)) {
          continue;
        }

        if (!reelingFlag) {
          // If not Reeling, we take that data
          const key = `${mpn}-@-${manufacturer}`;
          mapByManufacturers.get(key)
            ? mapByManufacturers.get(key).push(responseData)
            : mapByManufacturers.set(key, [responseData]);
        }

        // Create Map of Part Number and Data of Cut and Tape.

        // Send these data to a special filter

        // try{
        //     result.push(filterData(quantity, partNumberVal, mpn, priceBreak, distributer, availability, descr, manufacturer, moq, spq, currency, NaN, NaN, NaN));
        // } catch(error){
        //     console.log(`Error in Element14 for ${mpn} - `,error);
        // }
      }

      // console.log("New Map = ",mapByManufacturers);

      for (const [key, value] of mapByManufacturers.entries()) {
        // Special Filter
        const mpn = apiUtil.extractMpn(key).mpn;
        const manufacturer = apiUtil.extractMpn(key).manufacturer;
        try {
          // console.log("**********************");
          // console.log("Special filter calling for : ",key)
          result.push(specialFilter(quantity, mpn, value, manufacturer));
        } catch (error) {
          console.log(
            `Error in Special filter for Element14 for ${key} - `,
            error
          );
        }
      }

      return result;

    case "Texas":
      // console.log("Texas data = ",data);
      const mpn = data.tiPartNumber;

      try {
        const distributer = "Texas Instruments";
        const priceBreak = data.pricing[0].priceBreaks;
        const availability = data.quantity;
        const descr = data.description;
        const manufacturer = "Texas Instruments";
        const moq = data.minimumOrderQuantity;
        // const spq = data.standardPackQuantity;
        const currency = "INR";
        result.push(
          filterData(
            quantity,
            partNumberVal,
            mpn,
            priceBreak,
            distributer,
            availability,
            descr,
            manufacturer,
            moq,
            NaN,
            currency,
            NaN,
            conversion_from_usd,
            NaN
          )
        );
      } catch (error) {
        console.log(`Error in Texas for ${mpn} - `, error);
      }

      return result;

    case "TME":
      // console.log("TME Data = ",data);
      // console.log("PartNum = ",partNumberVal);

      for (let i = 0; i < data.length; i++) {
        const distributer = "TME";
        const TMEPartNum = data[i].TMEPartNum;
        const manufacturer = data[i].Manufacturer;
        const descr = data[i].Description;
        const moq = data[i].Moq;
        const mpn = data[i].MPN;
        const spq = data[i].Spq;

        const priceresult = await dataFetch.getTMEPriceAndStocks(TMEPartNum);
        const responseData = priceresult.Data.ProductList;
        const availability = responseData[0].Amount;
        let currency = priceresult.Data.Currency;
        const priceBreak = responseData[0].PriceList;

        let convert = 1;

        if (currency === "USD") {
          convert = conversion_from_usd;
          currency = "INR";
        }

        if (!apiUtil.matchString(String(partNumberVal), mpn)) {
          continue;
        }

        try {
          result.push(
            filterData(
              quantity,
              partNumberVal,
              mpn,
              priceBreak,
              distributer,
              availability,
              descr,
              manufacturer,
              moq,
              spq,
              currency,
              NaN,
              convert,
              NaN
            )
          );
        } catch (error) {
          console.log(`Error in TME for ${mpn} - `, error);
        }
      }

      // console.log("Result from cleaning TME : ", result);
      return result;

    // spq and lead
    case "Rutronik":
      // console.log("Rutronik data : ",data);

      for (let i = 0; i < data.length; i++) {
        const responseData = data[i];
        const distributer = "Rutronik";
        const availability = parseInt(responseData.stock) || 0;
        const descr = responseData.description;
        let currency = responseData.currency;
        const manufacturer = responseData.manufacturer;
        const moq = parseInt(responseData.moq);
        const mpn = responseData.mpn;
        const priceBreak = responseData.pricebreaks;
        const spq = parseInt(responseData.pu);

        let convert = 1;

        if (currency === "EUR") {
          convert = conversion_from_eur;
          currency = "INR";
        }

        if (
          !apiUtil.matchString(String(partNumberVal), mpn) ||
          priceBreak.length === 0
        ) {
          continue;
        }

        // console.log("MPN good to go : ",mpn);

        try {
          result.push(
            filterData(
              quantity,
              partNumberVal,
              mpn,
              priceBreak,
              distributer,
              availability,
              descr,
              manufacturer,
              moq,
              spq,
              currency,
              convert,
              NaN,
              NaN
            )
          );
        } catch (error) {
          console.log(`Error in Rutronik for ${mpn} - `, error);
        }
      }

      return result;

    // lead, spq
    case "DigiKey":
      // console.log("DigiKey length : ",data.ProductDetails.length);

      const responseData = data.ProductDetails;
      const distributer = "DigiKey";
      const currency = "INR";

      for (let i = 0; i < responseData.length; i++) {
        // console.log("DigiKey data: ",responseData[i]);

        const mpn = responseData[i].ManufacturerPartNumber;
        const moq = parseInt(responseData[i].MinimumOrderQuantity);
        const manufacturer = responseData[i].Manufacturer.Value;
        const descr = `${responseData[i].DetailedDescription} - ${responseData[i].Packaging.Value}`;
        const availability = responseData[i].QuantityAvailable;
        const priceBreak = responseData[i]?.StandardPricing || [];

        // console.log("********");
        // console.log("MPN : ",mpn);
        // console.log("Availability : ",availability);
        // console.log("Manufacturer : ",manufacturer);
        // console.log("********");

        // Any cnversion algorithm

        //

        // Even though currently Digikey is providing exact match for MPN
        if (
          !apiUtil.matchString(String(partNumberVal), mpn) ||
          priceBreak.length === 0
        ) {
          continue;
        }

        // console.log("MPN : ",mpn);
        // console.log("Availability : ",availability);
        // console.log("Manufacturer : ",manufacturer);

        try {
          result.push(
            filterData(
              quantity,
              partNumberVal,
              mpn,
              priceBreak,
              distributer,
              availability,
              descr,
              manufacturer,
              moq,
              NaN,
              currency,
              NaN,
              NaN,
              NaN
            )
          );
        } catch (error) {
          console.log(`Error in DigiKey for ${mpn} - `, error);
        }
      }

      // console.log("Digikey result = ",result);
      return result;

    case "Digikey_keyword":
      // console.log("Data : ",data.Products.length);
      const resData = data.Products;
      const distri = "DigiKey";

      for (let i = 0; i < resData.length; i++) {
        const mpn = resData[i].ManufacturerProductNumber;
        // console.log("mpn = ",mpn);
        const descr = `${resData[i].Description.ProductDescription} -${resData[i].Description.DetailedDescription}`;
        const manufacturer = resData[i].Manufacturer.Name;
        const productVariations = resData[i].ProductVariations;

        let val = [];

        // Filtering out Digi Reel
        for (const item of productVariations) {
          if (
            item.PackageType.Name === "Digi-Reel®" ||
            (item.StandardPricing && item.StandardPricing.length === 0)
          ) {
            continue;
          }

          val.push(item);
        }

        const currency = "INR";

        if (!apiUtil.matchString(String(partNumberVal), mpn)) {
          continue;
        }

        try {
          result.push(
            DigikeySpecialFilter(
              quantity,
              mpn,
              val,
              manufacturer,
              descr,
              distri,
              currency
            )
          );
        } catch (error) {
          console.log(
            `Error in Special filter for Digikey for ${mpn} - `,
            error
          );
        }
      }

      return result;

    case "Arrow":
      const dataList = data.itemserviceresult.data[0].PartList;
      for (let i = 0; i < dataList.length; i++) {
        // const distributer = "Arrow";
        const mpn = dataList[i].partNum;
        const manufacturer = dataList[i].manufacturer.mfrName;
        const descr = dataList[i].desc;
        const currency = "INR";
        const websites = dataList[i].InvOrg.webSites;

        if (!apiUtil.matchString(String(partNumberVal), mpn)) {
          continue;
        }

        for (const item of websites) {
          const websiteName = item.code;
          const sources = item.sources;

          for (const sourceItem of sources) {
            if (websiteName === "Verical.com") {
              // for (const dataItem of sourceItem.sourceParts) {
              //   const moq = dataItem.minimumOrderQuantity;
              //   const spq = dataItem.packSize;
              //   const availability = dataItem.Availability[0].fohQty;
              //   const priceBreak = dataItem.Prices.resaleList;
              //   const distributer = "Verical";
              //   result.push(
              //     filterData(
              //       quantity,
              //       partNumberVal,
              //       mpn,
              //       priceBreak,
              //       distributer,
              //       availability,
              //       descr,
              //       manufacturer,
              //       moq,
              //       spq,
              //       currency,
              //       NaN,
              //       NaN,
              //       NaN
              //     )
              //   );
              // }
            } else if (websiteName === "arrow.com") {
              const distributer = "Arrow";

              const val = [];
              const sourceParts = sourceItem.sourceParts;
              console.log("sourceParts = ", sourceParts);

              for (const sourceData of sourceParts) {
                const availability = sourceData?.Availability[0].fohQty || 0;
                const priceBreak = sourceData?.Prices?.resaleList || [];

                console.log("availability = ", availability);
                console.log("priceBreak = ", priceBreak);

                if (availability !== 0 && priceBreak.length > 0) {
                  val.push(sourceData);
                }
              }

              if (val.length === 0) {
                continue;
              }

              result.push(
                arrowFilter(
                  quantity,
                  partNumberVal,
                  mpn,
                  val,
                  distributer,
                  descr,
                  manufacturer,
                  currency
                )
              );
            }
          }
        }
      }

      return result;

    case "database distributer":
      // for each record, send the record to the cleanDatabase function which finds the pricebreaks and get the correct price value.
      for (const record of data) {
        try {
          const cleanedData = await dataClean.cleanDatabase(
            record,
            quantity,
            conversion_from_usd
          );
          // console.log("cleaned data : ",cleanedData);
          result.push(cleanedData);
        } catch (error) {
          console.log("Error in Database clean : ", error);
        }
      }
      // console.log("Result : ",result);
      return result;
  }
};

// ***********************************************************

const createBatchPair_v2 = (dataObj) => {
  let manufacturerVal = [];

  if (dataObj.manufacturerVal !== "-") {
    manufacturerVal = dataObj.manufacturerVal
      .split("/")
      .map((item) => item.trim());
  }

  const batchPairs = [
    {
      partNumber: dataObj.partNumberVal,
      quantity: dataObj.quantityVal,
      manufacturerArray: manufacturerVal,
      description: dataObj.descriptionVal,
    },
  ];

  console.log("Manufacturer Value = ".manufacturerVal);

  return batchPairs;
};

// const createBatchPair = (
//   row,
//   quantityIndex,
//   partNumIndex,
//   manufacturerIndex,
//   descriptionIndex
// ) => {
//   let quantityVal = 0;
//   let partNumberVal = "";
//   let manufacturerVal = [];
//   let descVal = "";

//   // Getting the cooresponding Part Number and Quantity from the Excel File Data
//   row.map((cell, index) => {
//     if (index == quantityIndex) {
//       quantityVal = parseInt(cell);
//     }

//     if (index === partNumIndex) {
//       partNumberVal = cell;
//     }

//     if (index == manufacturerIndex) {
//       if (cell !== null) {
//         manufacturerVal = cell.split("/").map((item) => item.trim());
//       }
//     }

//     if (index == descriptionIndex) {
//       descVal = cell;
//     }
//   });

//   // console.log("Manufacturer Value = ",manufacturerVal);

//   const batchPairs = [
//     {
//       partNumber: partNumberVal,
//       quantity: quantityVal,
//       manufacturerArray: manufacturerVal,
//       description: descVal,
//     },
//   ];

//   return batchPairs;
// };

const getSortedWebData = async (dataObj, USD_TO_INR, EUR_TO_INR) => {
  try {
    const index = dataObj.index;

    // For now only one partNum-quantity per batch
    const batchPairs = createBatchPair_v2(dataObj);

    const partNumberVal = batchPairs[0].partNumber;
    const quantityVal = batchPairs[0].quantity;
    const manufacturerVal = batchPairs[0].manufacturerArray;
    const descriptionVal = batchPairs[0].description;
    const fileId = dataObj.fileId;
    const userId = dataObj.userId;

    // console.log("File id in sort data = ",fileId);
    // console.log("manufacturerVal in sort data = ",manufacturerVal);
    // console.log("partNumberVal in sort data = ",partNumberVal);
    // console.log("quantityVal in sort data = ",quantityVal);

    // Not used now
    // if (quantityVal == 0){
    //     const priceVal =  [{
    //         Quantity: parseInt(quantityVal),
    //         Price: "NA",
    //         Unit_Price: "NA",
    //         Currency: "NA"
    //     }]
    //     return apiUtil.createResObj(index,partNumberVal,"NA","NA","Quantity cannot be 0","NA",priceVal, "NA", quantityVal);
    // }

    // console.log("Manufacturer : ",manufacturerVal);
    // console.log("Description : ",descriptionVal);

    const apiFunctions = [
      // dataFetch.getMouserData,
      // dataFetch.getTexasData,
      // dataFetch.getElementData,
      // dataFetch.getTMEData,
      // dataFetch.getDatabaseData,
      // dataFetch.getRutronikData,
      // dataFetch.getDigikeyKeywordData,
      dataFetch.getArrowData,
    ];
    //   dataFetch.getDigiKeyData,
    // Key is `${partNumberVal}-${quantityVal}` and value is an array of objects of data.
    let responseMap = new Map();

    const promises = [];

    for (const apiFunc of apiFunctions) {
      promises.push(apiFunc(batchPairs, USD_TO_INR, EUR_TO_INR));
    }

    const responses = await Promise.all(promises);
    console.log("Responses after promise = ", responses);
    // console.log("Data in responses = ",responses[0].get('SMBJ5.0A-400'));

    for (let i = 0; i < responses.length; i++) {
      const resMap = responses[i];
      // console.log("Res Map = ",resMap);

      if (resMap) {
        for (const [key, value] of resMap.entries()) {
          if (responseMap.has(key)) {
            responseMap.get(key).push(value);
          } else {
            responseMap.set(key, [value]);
          }
        }
      }
    }

    console.log("responseMap = ", responseMap);
    console.log("responseMap.size = ", responseMap.size);

    if (!responseMap.size) {
      // const priceVal =  [{
      //     Quantity: quantityVal,
      //     Price: "NA",
      //     Unit_Price: "NA",
      //     Currency: "NA"
      // }]

      const distributer = "NA";
      const avail = "NA";
      const unit_price = "NA";
      const total_price = "NA";
      const descr = "Part Number not found !";
      const icon = false;
      const mpn = "Part Number not found !";
      const brand = "NA";
      const quantity = quantityVal;

      await saveResult(
        fileId,
        index,
        0,
        icon,
        mpn,
        distributer,
        brand,
        descr,
        quantity,
        unit_price,
        total_price,
        avail
      );

      return [
        {
          index: index,
          data_id: 0, // THis will be the best price sorted id
          file_id: fileId, // Giving by default
        },
      ];

      // return apiUtil.createResObj(index,partNumberVal,"NA","NA","Part Number not found !","NA",priceVal, "NA", quantityVal);
    }

    for (const [key, value] of responseMap.entries()) {
      const quantity = apiUtil.extractQuantity(key);

      let allData = [];
      // console.log("Val = ",value);

      for (let i = 0; i < value.length; i++) {
        const data = value[i].data;
        const distributer = value[i].distributer;
        // console.log("Data = ",data);
        // console.log("distributer = ",distributer);

        // if (distributer !== "TME"){
        try {
          const cleanData = await cleanDataFunction(
            data,
            distributer,
            quantity,
            partNumberVal,
            USD_TO_INR,
            EUR_TO_INR
          );
          // console.log("Clean Data = ",cleanData);
          if (cleanData !== undefined && cleanData.length > 0) {
            allData.push(...cleanData);
          }
          // console.log("All data = ",allData);
        } catch (error) {
          console.log("Issue : ", error);
        }
        // }
      }

      // console.log("Reached before sorting all Data");

      const priceSortedData = apiUtil.sortData(allData, quantity);
      // console.log("Price Sorted data : ",priceSortedData);

      if (
        typeof priceSortedData === "undefined" ||
        priceSortedData.length === 0
      ) {
        // const priceVal =  [{
        //     Quantity: quantityVal,
        //     Price: "NA",
        //     Unit_Price: "NA",
        //     Currency: "NA"
        // }]

        const distributer = "NA";
        const avail = "NA";
        const unit_price = "NA";
        const total_price = "NA";
        const descr = "Part Number not found !";
        const icon = false;
        const mpn = "Part Number not found !";
        const brand = "NA";
        const quantity = quantityVal;

        await saveResult(
          fileId,
          index,
          0,
          icon,
          mpn,
          distributer,
          brand,
          descr,
          quantity,
          unit_price,
          total_price,
          avail
        );

        return [
          {
            index: index,
            data_id: 0, // THis will be the best price sorted id
            file_id: fileId, // Giving by default
          },
        ];

        // return apiUtil.createResObj(index,partNumberVal,"NA","NA","Part Number not found !","NA", priceVal, "NA", quantityVal);
      }

      // Sort the priceSortedData by Manufacturer
      let manufacturerSortedData = priceSortedData;
      if (manufacturerVal.length > 0) {
        manufacturerSortedData = apiUtil.manufactureSortData(
          priceSortedData,
          manufacturerVal
        );
      }

      // console.log("*******************")
      // console.log("manufacturer Value : ",manufacturerVal);
      // console.log("manufacturer sorted Data : ",manufacturerSortedData);
      // for (const item of manufacturerSortedData){
      //     console.log("Data = ",item);
      //     console.log("Price = ",item.Price);
      // }
      // console.log("*******************");

      // console.log("Quantity Val new = ", manufacturerSortedData[0]);

      for (let i = 0; i < manufacturerSortedData.length; i++) {
        const mpn = manufacturerSortedData[i].MPN;
        const distributer = manufacturerSortedData[i].Distributer;
        const brand = manufacturerSortedData[i].Manufacturer;
        const descr = manufacturerSortedData[i].Description;
        const quantity = isNaN(
          parseInt(manufacturerSortedData[i].Price[0].Quantity)
        )
          ? quantityVal
          : parseInt(manufacturerSortedData[i].Price[0].Quantity); // This is to accomodate the new spq rounded quantities. If the quantity is some string (Min quota or stock issue or something, then the original quantiy will be shown)
        const unit_price = manufacturerSortedData[i].Price[0].Unit_Price;
        const total_price = manufacturerSortedData[i].Price[0].Price;
        const avail = manufacturerSortedData[i].Availability;
        // const icon = (mpn == partNumberVal) ? true : false;

        let icon = false;

        if (mpn === partNumberVal) {
          if (manufacturerVal.length > 0) {
            if (
              manufacturerVal.some((manufacturer) =>
                apiUtil.matchString(manufacturer, brand)
              )
            ) {
              icon = true;
            }
          } else {
            icon = true;
          }
        }

        await saveResult(
          fileId,
          index,
          i,
          icon,
          mpn,
          distributer,
          brand,
          descr,
          quantity,
          unit_price,
          total_price,
          avail
        );
      }

      // THis is to inform the frontend that the dat have been updated in the databse.
      return [
        {
          index: index,
          data_id: 0, // THis will be the best price sorted id
          file_id: fileId, // Giving by default
        },
      ];
    }
  } catch (error) {
    console.log("Error in web sort data : ", error);
  }
};

const saveResult = async (
  file_id,
  index,
  data_id,
  icon,
  recommended_MPN,
  distributer,
  brand,
  description,
  quantity,
  unit_price,
  total_price,
  availability
) => {
  console.log("index in save = ", index);

  const saveObj = {
    file_id: file_id, // Giving a default value for now
    index: index,
    data_id: data_id,
    icon: icon,
    recommended_MPN: recommended_MPN,
    distributer: distributer,
    brand: brand,
    description: description,
    quantity: quantity,
    unit_price: unit_price,
    total_price: total_price,
    availability: availability,
  };

  // const data_already_present = await dataRepo.findData(file_id, index, data_id);

  // if (!data_already_present){
  try {
    await dataRepo.createData(saveObj);
  } catch (error) {
    console.log("Error in saving data : ", error);
  }
  // } else {
  //   // Update the values
  //   await dataRepo.updateData(file_id, index, data_id, saveObj);
  // }
};

module.exports = {
  getSortedWebData,
};
