// node_modles
import * as cheerio from 'cheerio';
import axios from 'axios';


// extracts the 'href' attribute from the elements
export function linkExtractor(rawHtmlData) {
    let $ = cheerio.load(rawHtmlData);
    let hrefs = $(".monthly-daypanel").get().map(elem => $(elem).attr('href')); // extracts 'href' attribtes
    hrefs = hrefs.filter(elem => elem !== undefined)
    return hrefs;
}


export async function scrap(href, monthName)
{
    try {
        let weatherInfoObj = await new Promise( (resolve, reject) => 
        {
            axios.get(href).then( async response => 
            {
                let $ = cheerio.load(response.data);
                
                let date = $(".subnav-pagination div").text().split(" ");
                let pageMonth = date[1];    // month name in the html page
                let day = date[2];      // date of month in the html page

                // check the html page to be for the month name provided in the url
                if (monthName.toLowerCase() === pageMonth.toLowerCase()) 
                {
                    // **************************************************
                    //               Day and Night data
                    // **************************************************

                    let weatherInfo = {};   // main result object

                    let cards = $(".half-day-card").get();  // parent of needed html elemets
                    let cardsLen = cards.length;
                    let counter = 0;    // for counting the iterations of forEach loop below

                    cards.forEach(item => 
                    {
                        let cardHeader = $(item).children().eq(0);      // summary section of the card
                        
                        // separate day/night data from each other
                        let dayOrNight = cardHeader.children().eq(0).text();
                        weatherInfo[dayOrNight] = {};  // 'Day' OR 'Night' key


                        let cardContent = $(item).children().eq(1);     // full data of day/night 
                        let leftPanel = cardContent.children().eq(1).children().eq(0);
                        let rightPanel = cardContent.children().eq(1).children().eq(1);

                        // 'description' key
                        weatherInfo[dayOrNight]["description"] = cardContent.children().eq(0).text();

                        // 'iconPath' key
                        weatherInfo[dayOrNight]["iconPath"] = "https://www.accuweather.com/" + 
                            cardHeader.children().eq(1).attr("data-src");

                        // **************************************************
                        //           other keys of Day/Night section
                        // **************************************************

                        let key, value;
                        
                        for (let i = 0, len = leftPanel.children().length; i < len; i++) {
                            value = leftPanel.children().eq(i).children().eq(0).text().trim();
                            key = leftPanel.children().eq(i).text().replace(value, "").trim();
                            weatherInfo[dayOrNight][key] = value;
                        }

                        for (let i = 0, len = rightPanel.children().length; i < len; i++) {
                            value = rightPanel.children().eq(i).children().eq(0).text().trim();
                            key = rightPanel.children().eq(i).text().replace(value, "").trim();
                            weatherInfo[dayOrNight][key] = value;
                        }


                        // **************************************************
                        //               sunset/sunrise data
                        // **************************************************
                        
                        // delete the object to be ater Day/Night section in the object
                        // it will be regenerated
                        delete weatherInfo.SunriseOrSunset;

                        let sunSetRise = $(item).parents().children().eq(4);    // sunset and sunrise data
                        let sunrisePanel = sunSetRise.children().eq(1).children().eq(0);
                        let sunsetPanel = sunSetRise.children().eq(1).children().eq(1);

                        // Sun 'duration' key
                        let durationContainer = sunrisePanel.children().eq(0).children().eq(1);
                        let duration = durationContainer.children().eq(0).text().trim() + " " +
                            durationContainer.children().eq(1).text().trim();
                        weatherInfo["SunriseOrSunset"] = { Sun: { duration } };

                        // Sun 'risingTime' key
                        let sunRisingTime = sunrisePanel.children().eq(1).children().eq(1).text();
                        weatherInfo["SunriseOrSunset"]["Sun"]["risingTime"] = sunRisingTime;
                        
                        // Sun 'fallingTime' key
                        let sunFallingTime = sunrisePanel.children().eq(2).children().eq(1).text();
                        weatherInfo["SunriseOrSunset"]["Sun"]["fallingTime"] = sunFallingTime;


                        // Moon 'duration' key
                        durationContainer = sunsetPanel.children().eq(0).children().eq(1);
                        duration = durationContainer.children().eq(0).text().trim() + " " +
                            durationContainer.children().eq(1).text().trim();
                        weatherInfo["SunriseOrSunset"]["Moon"] = { duration };

                        // Moon 'risingTime' key
                        let moonRisingTime = sunsetPanel.children().eq(1).children().eq(1).text();
                        weatherInfo["SunriseOrSunset"]["Moon"]["risingTime"] = moonRisingTime;
                        
                        // Moon 'fallingTime' key
                        let moonFallingTime = sunsetPanel.children().eq(2).children().eq(1).text();
                        weatherInfo["SunriseOrSunset"]["Moon"]["fallingTime"] = moonFallingTime;


                        // **************************************************
                        //              temperature history data
                        // **************************************************

                        // delete the object to be ater Day/Night section in the object
                        // it will be regenerated
                        delete weatherInfo.temperatureHistory;

                        let temperatureHistory = $(item).parents().children().eq(5).children().eq(0); 

                        let forecastHigh = temperatureHistory.children().eq(2).children().eq(1).text().trim();
                        let forecastLow = temperatureHistory.children().eq(2).children().eq(2).text().trim();

                        let avgHigh = temperatureHistory.children().eq(3).children().eq(1).text().trim();
                        let avgLow = temperatureHistory.children().eq(3).children().eq(2).text().trim();

                        let lastYearHigh = temperatureHistory.children().eq(4).children().eq(1).text().trim();
                        let lastYearLow = temperatureHistory.children().eq(4).children().eq(2).text().trim();

                        weatherInfo["temperatureHistory"] = {
                            forecast: { low: forecastLow, high: forecastHigh },
                            average: { low: avgLow, high: avgHigh },
                            lastYear: { low: lastYearLow, high: lastYearHigh },
                         };



                        // **************************************************
                        //              end of the scrapping
                        // **************************************************
                        
                        counter++;
                        if (counter === cardsLen) {
                            weatherInfo.date = day;
                            resolve({ success: true, data: weatherInfo });
                        }
                    });
                }


                else resolve({ success: true, data: null });    // no data for this month
                
            }).catch((error) => {
                console.log(error);
                reject({ success: false, error });
            });
        });
        
        
        return weatherInfoObj;
    }

    catch(error) {
        console.log("\n");
        console.log("* Error in scrap() - scrapper-tools.mjs file");
        console.log(error);
        console.log("\n");
        process.exit(0);
    }
}
