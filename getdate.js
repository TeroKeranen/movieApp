function getDate ()  {
    let today = new Date();
    let options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    }

    let day = today.toLocaleDateString('fi-FI', options);
    
    return day;
};

module.exports = {
    getDate
}