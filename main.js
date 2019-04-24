dataset = []
parseData = (d) => {
    let data = [];
    let keys = Object.keys(d);
    keys.forEach(key => {
        data[key] = parseInt(d[key]);
    });
    return data;
}
sumData = (champ_data, game_data) => {
    let myData = {};
    // // console.log(Object.keys(champ_data.data));
    // for(let i = 0; i < game_data.length; i++){
    //     for(let j = 0; j < 10; j++){
    //         let champId = game_data[i][`t${j % 2}_champ${Math.floor(j / 2) + 1}id`];

    //         myData 
    //         myData[`${champId}`] = [] || myData[`${champId}`];
    //         myData[`${champId}`]
    //         // console.log();
    //         // if(champId == undefined){
    //         //     console.log(game_data[i]);
    //         // }
    //         // console.log(game_data[i][`t${j % 2}_champ${Math.round(j / 2) + 1}id`]);
    //     }
    // }
    let champKeys = Object.keys(champ_data.data);
    for(let i = 0; i < champKeys.length; i++){
        let id = champ_data.data[champKeys[i]].id
        let values = [];
        for(let j = 0; j < 10; j++){
            let teamNumber = j % 2 + 1;
            let champNumber = Math.floor(j / 2) + 1;
            let gameValues = game_data.filter(game => game[`t${teamNumber}_champ${champNumber}id`] == id);
            values = values.concat(gameValues);
        }
        myData[id] = values;
    }
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
    d3.csv('./assets/lol/games.csv', parseData).then((game_data) => {
        d3.json('./assets/lol/champion_info.json').then((champ_data) => {
            dataSet = sumData(champ_data, game_data);
            makeChart(game_data);
        });        
    })
}

