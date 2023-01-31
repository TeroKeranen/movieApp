function getColor(vote) {
                if(vote >= 8) {
                    return 'green'
                } else if (vote >= 5) {
                    return 'orange'
                } else {
                    return 'red'
                }
            }

module.exports = {
    getColor
}