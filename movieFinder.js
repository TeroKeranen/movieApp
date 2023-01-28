function getMovies (url,response, msg) {

            fetch(url)
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
                        titles.push(title);
                        posters.push(poster_path)
                        overviews.push(overview)
                        voteAvg.push(vote_average)
                        
                        
                    })
                    
                    response.render('home', {movieTitle: titles, poster: posters, overview : overviews, vote: voteAvg, title: "MoviaApp", logged: true, message: msg})
                })
        }


module.exports = {
    getMovies
}