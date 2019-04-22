dataset = []
parseData = (d) => {
    let data = [];
    let keys = Object.keys(d);
    keys.forEach(key => {
        data[key] = parseInt(d[key]);
    });
    return data;
}
sumData = (data) => {
    let myData = data.filter(game => game.t1_champ1id == 8);
    console.log(myData);
}
makeChart = () => {
    // d3.nest().key((d) =>d.organisation.Country)
    // .rollup((leaves) => {
    //     return d3.sum(leaves, function(d){
    //         return d.Value;
    //     });
    // }).entries(data)
    // .map(function(d){
    //     return { Country: d.key, Value: d.values};
    // });
}

window.onload = () => {
    d3.csv('./assets/lol/games.csv', parseData).then((data) => {
        dataSet = sumData(data);
        makeChart(data);
    })
}

