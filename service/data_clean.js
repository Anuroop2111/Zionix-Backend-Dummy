const price_breaks = require('../repository/price_breaks_repository');
const apiUtil = require("../util/apiUtil");

// Cleaning the Data received from Distributer APIs
// ***********************************************************

const cleanDataHelper = (mpn, quantity, avail, descr, priceBreak, manufacturer, currency, distributer, spq) =>{
    // console.log("Inside cleanDataHelper distributer: ",distributer);
    // console.log("Inside cleanDataHelper priceBreak: ",priceBreak);

    let unitPrice = 0;

    // Not used now
    // if (quantity===0 || priceBreak.length === 0){
    //     const priceVal = [{
    //         Quantity: `Quantity given is 0`,
    //         Price: "0",
    //         Currency: 'INR'
    //     }];
    //     return apiUtil.createResultObj(mpn, distributer, avail, descr, priceVal, manufacturer);
    // };

    // Not used now
    // if (priceBreak[0].Quantity > quantity){
    //     const priceVal = [{
    //         Quantity: `Min. ${priceBreak[0].Quantity} req.`,
    //         Price: "NaN",
    //         Currency: currency
    //     }]

    //     return apiUtil.createResultObj(mpn, distributer, avail, descr, priceVal, manufacturer);
    // }

    let value = 0;
    
    if (spq === undefined || isNaN(spq)){
        spq = 1;
    }

    // console.log("In cleanDataHelper spq = ",spq);

    const remainder = quantity%spq;
    let new_quantity = quantity;

    // Check if the quantity is not already a multiple of SPQ
    if ( remainder > 0){
        // Adjusting to next higher multiple of spq
        new_quantity = new_quantity - remainder + spq;
    }

    console.log("*************");
    console.log("MPN = ",mpn);
    console.log("Manufacturer = ",manufacturer);
    console.log("SPQ = ",spq);
    console.log("quantity : ",quantity);
    console.log("new_quantity : ",new_quantity);
    console.log("Avail = ",avail);
    console.log("priceBreak = ",priceBreak);

    if (new_quantity > avail){
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
    }



    for (let i = 0; i < priceBreak.length; i++){
        if (new_quantity < parseInt(priceBreak[i].Quantity)){
            value = (new_quantity * priceBreak[i-1].Price).toFixed(2);
            unitPrice = priceBreak[i-1].Price;
            // console.log("Value = ",value);
            break;
        } 
    }

    if (value===0){
        const lastPrice = priceBreak[priceBreak.length-1].Price;
        value = (new_quantity * lastPrice).toFixed(2);
        unitPrice = lastPrice;
    }

    const priceVal = [{
        Quantity: new_quantity,
        Price: value,
        Unit_Price: unitPrice,
        Currency: currency
    }];

    console.log("priceVal = ",priceVal);
    console.log("*************");


    return apiUtil.createResultObj(mpn, distributer,avail,descr,priceVal,manufacturer);
}

const cleanMouser = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer) => {
    // const avail = availability!==undefined ? availability : "Unavailable";
    
    // const cur = priceBreak[0].Currency;
    // if cur is USD or EUR, apply the required conversion.

    const convertedPriceBreak = priceBreak.map((item) =>({
        Quantity: item.Quantity,
        Price: parseFloat(item.Price.slice(1).replace(/,/g,'')),
        Currency: item.Currency
    }))

    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer, spq);
};

const cleanElements = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer) => {
    // if cur is USD or EUR, apply the required conversion.
    const convertedPriceBreak = priceBreak.map(price =>({
        Quantity: price.from,
        Price: parseFloat(price.cost),
        Currency: "INR"
    }));

    // console.log("Converted price break inside Element14 : ",convertedPriceBreak);

    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer, spq);
};

const cleanTexas = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer, convert_from_eur, convert_from_usd, lead) => {
    // console.log("Inside texas clean");
    // const distributer = "Texas Instruments";
    // const availability = responseData.quantity; // Not given
    // const descr = responseData.description;
    // // Manufacturer -> TI itself
    // const manufacturer = "Texas Instruments";
    // const mpn = responseData.tiPartNumber;

    // const currency = "INR";

    // const priceBreak = responseData.pricing[0].priceBreaks;

    const convertedPriceBreak = priceBreak.map(price => ({
        Quantity: price.priceBreakQuantity,
        Price: parseFloat((price.price)), // to convert USD to INR
        Currency: currency
    }));

    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer, spq);
};

const cleanTME = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer,convert_from_eur, convert_from_usd) => {

    const convertedPriceBreak = priceBreak.map((item) => ({
        Quantity: item.Amount,
        Price: parseFloat(item.PriceValue * convert_from_usd),
        Currency: currency
    }));

    // console.log("Converted Price Break of TME : ",convertedPriceBreak);

    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer, spq);

};

const cleanRutronik = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer,convert_from_eur) => {

    const convertedPriceBreak = priceBreak.map((price) => ({
        Quantity: price.quantity,
        Price: parseFloat(price.price) * convert_from_eur,
        Currency: currency
    }));

    // console.log("convert in Rutronik : ",convert);
    // console.log("converted Price in Rutronik : ",convertedPriceBreak);


    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer, spq);

};

const cleanDigiKey = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer) => {
    // const distributer = "DigiKey";
    // const currency = "INR";

    const convertedPriceBreak = priceBreak.map((price) => ({
        Quantity: price.BreakQuantity,
        Price: parseFloat(price.UnitPrice),
        Currency: "INR"
    }));

    // console.log("Digikey converted Price break : ",convertedPriceBreak);

    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer);
};

const cleanVerical = (mpn, quantity, priceBreak, spq, manufacturer, availability, descr, currency, distributer) => {
    const convertedPriceBreak = priceBreak.map((price) => ({
        Quantity: price.minQty,
        Price: parseFloat(price.price),
        Currency: "INR"
    }));

    return cleanDataHelper(mpn, quantity, availability, descr, convertedPriceBreak, manufacturer, currency, distributer);
}

const cleanDatabase = async (record,quantity,conversion) =>{
    const componentId = record.component_id;
    const distributer = record.distributer_name;
    const avail = record.availability;
    const descr = record.description;
    const currency = "INR"
    const manufacturer = record.manufacturer_name;
    const moq = record.moq;
    const mpn = record.part_number;

    // Get price Breaks for that particular component_id from the price_breaks table.
    // const priceVal = [{
    //     Quantity: quantity,
    //     Price: "NaN",
    //     Currency: currency
    // }]

    let price = 0;
    if (quantity < moq) {
        price = "NaN"
    }

    price = await price_breaks.findPrice(componentId,quantity);

    const priceVal = [{
        Quantity: quantity,
        Price: parseFloat(quantity*price),
        Currency: currency
    }];

    return apiUtil.createResultObj(mpn, distributer, avail, descr, priceVal, manufacturer);

    // return cleanDataHelper(quantity,distributer,avail,descr,currency,convertedPriceBreak,Manufacturer);
}


module.exports = {
    cleanMouser,
    cleanElements,
    cleanTexas,
    cleanTME,
    cleanDatabase,
    cleanRutronik,
    cleanDigiKey,
    cleanVerical
};