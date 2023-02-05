const date = new Date();

function getDate(){

    // Get date
    let month = date.getMonth();
    let day = date.getDate();
    let year = date.getFullYear();

    let dateString = (month + "-" + day + "-" + year);

    // Get time
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    let timeString = (hours + ":" + minutes + ":" + seconds);

    console.log(dateString + " " + timeString);
    return (dateString + " " + timeString)
};

getDate();


