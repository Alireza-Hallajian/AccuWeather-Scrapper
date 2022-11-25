// tools
import * as GENERAL_TOOLS from './tools/general-tools.mjs';
import * as SCRAP_TOOLS from './tools/scrapper-tools.mjs';

const accuweatherLink = process.argv[2];


async function run() 
{
    let validateUrl = await GENERAL_TOOLS.validateUrl(accuweatherLink);

    if (!validateUrl.isValid) {
        console.log("* The entered url is NOT valid");
        process.exit(0);
    } 

    else 
    {
        let monthName = GENERAL_TOOLS.getMonthName(accuweatherLink);
        let hrefs = SCRAP_TOOLS.linkExtractor(validateUrl.data);    // array

        GENERAL_TOOLS.generateFullWeatherJson(hrefs, monthName, accuweatherLink);
    }
}

run();
