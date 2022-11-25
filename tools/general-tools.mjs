// node_modles
import axios from 'axios';
import exp from 'constants';
import * as fs from 'fs';

// tools
import * as SCRAP_TOOLS from './scrapper-tools.mjs';


// checks if the input link is available and valid
export async function validateUrl(url)
{
    if (!url) {
        console.log("* The URL MUST be entered as an argument");
        process.exit(0);
    }

    else if (url.slice(0, 27) !== "https://www.accuweather.com") {
        console.log("* Only the urls from 'https://www.accuweather.com' are accpeted");
        process.exit(0);
    }

    try {
        let isValid = await new Promise( (resolve, reject) => 
        {
            axios.get(url).then( async response => {
                resolve({ isValid: true, data: response.data });      // the url is valid
            })
            .catch((error) => {
                // axiosErrorHandler(error);
                resolve({ isValid: false, data: response.data });     // the url is invalid
            });
        });

        return isValid;
    }

    catch(error) {
        console.log("* Error in validateUrl() - general-tools.mjs file");
        console.log(error);
    }
}


// extract the name of the month from url
export function getMonthName(url) {
    return url.slice(48).split("-")[0];
}


// generate full-JSON data of month weatherInfo
export async function generateFullWeatherJson(urls, monthName, accuweatherLink)
{
    let monthlyWeatherJson = {
        url: accuweatherLink,
        result: { 
            days: {} 
        }
    };
    let counter = 0;    // counts got months info

    urls.forEach(async url =>
    {
        let dailyWeather = await SCRAP_TOOLS.scrap("https://www.accuweather.com"+url, monthName);

        if (!dailyWeather.success) {
            console.log("\n");
            console.log("* Error in getting daily info in generateFullWeatherJson() - general-tools.mjs file");
            console.log(dailyWeather.error);
            console.log("\n");
            process.exit(0);
        } 
        else counter++;

        // if there is data for the requested month (we omit prev or next month data)
        if (dailyWeather.data) {
            let date = dailyWeather.data.date;
            monthlyWeatherJson["result"]["days"][date] = dailyWeather.data;
            delete monthlyWeatherJson["result"]["days"][date].date;
        }

        if (counter === urls.length) {
            let newDaysObj = createNullDays(monthlyWeatherJson.result.days);
            monthlyWeatherJson["result"]["days"] = newDaysObj
            writeToJson(monthlyWeatherJson, monthName);
        }
    });
} 


// write data to a JSON file
export function writeToJson(jsonData, filename) {
    fs.writeFile(`./monthlyWeather/${filename}.json`, JSON.stringify(jsonData, null, 2), (err, data) => {
        if (err) throw err;
        console.log("*** done");
    });
}


// create empty data for non-existing days
export function createNullDays(daysObj)
{
    let array = [];
    for (let key in daysObj) {
        array.push(+key)
    }

    let minDay = Math.min(...array);    // first existing day of the month 
    let newDaysObj = {};

    for (let i = 1; i < minDay; i++) {
        newDaysObj[i] = null;
    }

    return Object.assign(newDaysObj, daysObj);
}
