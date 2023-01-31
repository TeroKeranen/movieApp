function getMovies (url,response, msg) {

            const popularMovies = url;

            // this function return class color on page
            function getColor(vote) {
                if(vote >= 8) {
                    return 'green'
                } else if (vote >= 5) {
                    return 'orange'
                } else {
                    return 'red'
                }
            }

            fetch(popularMovies)
                .then(res => res.json())
                .then(data => {
                    
                    // showMovies(data.results)
                    const results = data.results;
                    // create arrays where to push movie datas
                    let titles = []
                    let posters = []
                    let overviews = []
                    let voteAvg = []

                    // iterate trought data results
                    results.forEach(movie => {
                        const {title, poster_path, vote_average, overview} = movie;

                        // push values to theyr arrays
                        titles.push(title);
                        posters.push(poster_path)
                        overviews.push(overview)
                        voteAvg.push(vote_average)
                        
                        
                    })
                    
                    response.render('home', {color: getColor,movieTitle: titles, poster: posters, overview : overviews, vote: voteAvg, title: "MoviaApp", logged: true, message: msg})
                })
                .catch((error) => {
                     response.render('home', {color: getColor,movieTitle:" titles", poster:" posters", overview : "overviews", vote: "voteAvg", title: "MoviaApp", logged: true, message: error})
                })
        }





module.exports = {
    getMovies
}