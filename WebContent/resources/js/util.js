/**
 * @global
 * @param {*} totalSeconds 
 * @returns time in desired format
 */
function getFormattedSeconds(totalSeconds) {

    if (totalSeconds >= 31536000) {
    	year = Math.floor(totalSeconds/31536000);
    	totalSeconds %= 31536000;
    	month = Math.floor(totalSeconds/2592000);
    	totalSeconds %= 2592000;
    	days = Math.floor(totalSeconds/86400);
    	totalSeconds %= 86400;
        hours = Math.floor(totalSeconds / 3600)
        totalSeconds %= 3600;
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;
        
        year += Math.round((month/12) * 10) / 10; 
		// We are takaing a very straghtforward assumption that a year is 365 days and every month has 30 days
        return year + "year(s)" +((hours > 9) ? hours : "0" + hours) + " : " + ((minutes > 9) ? minutes : "0" + minutes) + " : " + ((seconds > 9) ? seconds : "0" + seconds) + "";
    } else if (totalSeconds >= 2592000) {
    	month = Math.floor(totalSeconds/2592000);
    	totalSeconds %= 2592000;
    	days = Math.floor(totalSeconds/86400);
    	totalSeconds %= 86400;
        hours = Math.floor(totalSeconds / 3600)
        totalSeconds %= 3600;
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;
        month += Math.round((days/30) * 10) / 10;
		// We are takaing a very straghtforward assumption that every month has 30 days
        return month +"month(s) "+((hours > 9) ? hours : "0" + hours) + " : " + ((minutes > 9) ? minutes : "0" + minutes) + " : " + ((seconds > 9) ? seconds : "0" + seconds) + "";
    } else if (totalSeconds >= 86400) {
    	days = Math.floor(totalSeconds/86400);
    	totalSeconds %= 86400;
        hours = Math.floor(totalSeconds / 3600)
        totalSeconds %= 3600;
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;

        return days + " day(s) "+((hours > 9) ? hours : "0" + hours) + " : " + ((minutes > 9) ? minutes : "0" + minutes) + " : " + ((seconds > 9) ? seconds : "0" + seconds) + "";
    } else if (totalSeconds >= 3600) {
        hours = Math.floor(totalSeconds / 3600)
        totalSeconds %= 3600;
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;

        return ((hours > 9) ? hours : "0" + hours) + " : " + ((minutes > 9) ? minutes : "0" + minutes) + " : " + ((seconds > 9) ? seconds : "0" + seconds) + "";
    } else {
        minutes = Math.floor(totalSeconds / 60);
        totalSeconds %= 60;
        seconds = totalSeconds % 60;

        return ((minutes > 9) ? minutes : "0" + minutes) + " : " + ((seconds > 9) ? seconds : "0" + seconds) + "";
    }
}
