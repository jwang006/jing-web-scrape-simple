//setting modules we will use, including https/jssoup/fs
const https = require('https');
const JSSoup = require('jssoup').default;
const fs = require('fs');
const url = "https://en.wikipedia.org/wiki/Human_factors_and_ergonomics";//FIRST, find a url of a page on Wikipedia that you are interested in
//will save output in this json folder
const jsonPath = "./json/";  
const jsonPath2 = "./json-ergonomics/"; 
const imagePath = "./images/"; 
const name = "ergonomics";
const jsonImageName = "./json-/ergonomics-image";


/*
This web-scraping example is set up for working with wikipedia.If you want to adapt this
to scrape another site you should go and inspect the site in the browser first, then adapt this. 
*/

function getAllImages(soupTag){
    //console.log(soupTag);
    let imgs = soupTag.findAll('img');
    let imgUrls = [];

    for(let i = 0; i < imgs.length; i++){
        let attrs = imgs[i].attrs;// get a tag attributes
        // if there is an href attribute let's get it
        if('src' in attrs){
            let src = attrs.src;
            if(src.indexOf("wiki/Special:") == -1){ //these are not images
                if(src.indexOf("https:") == -1){
                    src = "https:"+src;
                }
                console.log(src);
                imgUrls.push(src);
            }
        }
    }

    return imgUrls;
}
//get all the image names and return as an array
function getImageNames(imageUrls){
    let imageFileNames = [];

    for(let i = 0; i < imageUrls.length; i++){
        imageFileNames.push(getName(imageUrls[i]));
    }

    return imageFileNames;
}
//split url on the "/" character and get the last element from 
//the returned array which will give us the file name
function getName(url){
    let parts = url.split("/");
    let name = parts[parts.length-1];
    return name;
}

//download images, pass in an array of urls
function recursiveDownload(imageUrlArray,i){
    
    //to deal with the asynchronous nature of a get request we get the next image on successful file save
    if (i < imageUrlArray.length) {
  
        //get the image url
        https.get(imageUrlArray[i], (res) => {
        
            //200 is a successful https get request status code
            if (res.statusCode === 200) {
                //takes the readable stream, the response from the get request, and pipes to a writeable stream
                res.pipe(fs.createWriteStream(imagePath+"/"+getName(imageUrlArray[i])))
                    .on('error', (e) => {
                        console.log(e);
                        recursiveDownload (imageUrlArray, i+1); //skip any failed ones
                    })
                    .once('close', ()  => {
                        console.log("File saved");
                        recursiveDownload (imageUrlArray, i+1); //download the next image
                    });
            } else {
                console.log(`Image Request Failed With a Status Code: ${res.statusCode}`);
                recursiveDownload (imageUrlArray, i+1); //skip any failed ones
            }

        });

    }
}
//scraper paragraphs
//this soupTag is our searched before;
// function getParaText(soupTag) {
//     //find is one element, and findAll will return all elements
//     let paragraphs = soupTag.findAll('p');
//     let text = "";//empty string

//     for (let i = 0 ; i < paragraphs.length; i ++) {
//         let p = paragraphs[i].getText().toLowerCase();

//         if (p.indexOf("human factors") != -1) {
//             //console all the sentences contenting human factors;
//             console.log(p);
//             text += p;
// }
//     //    text += paragraphs[i].getText();
//     }
//     return text;
// }

//pass in Plain Old Javascript Object that's formatted as JSON
function writeJSON(data){
    try {
        // let path = jsonPath+name+".json";
        //let path2 = jsonPath2+name+".json";
        let ImageName = jsonImageName+name+".json";
        fs.writeFileSync(ImageName, JSON.stringify(data, null, 2), "utf8");
        console.log("JSON file successfully saved");
    } catch (error) {
        console.log("An error has occurred", error);
    }
}

//create soup  
function createSoup(document){
    let soup = new JSSoup(document);
    //find a tag type
       // let main = soup.find('main');
    
    //find elements with an ID;
       let bodyContent = soup.find('div',{id:"bodyContent"});
       //console.log(bodyContent);
       // console.log(getParaText(bodyContent));

    //getParaText(bodyContent) means save those data from bodyContent part;
        // let data = {
        //     "name": name,
        //     "url": url,
        //     "text": getParaText(bodyContent)   
        // };
        // writeJSON(data);
  
    //search specific word and save whole sentances into json-ergonomics files
        // let ergonomicsWords = {
        //     "name": name,
        //     "url": url,
        //     "text": getParaText(bodyContent)
        // };
        // writeJSON(ergonomicsWords);


    //search images in bodycontent save download all images in images files;
    let images = getAllImages(bodyContent);
    let imageData = {
        "name": name,
        "url": url,
        "content": {}
    };

let newName = [];
for (let i =0; i < images.length ; i ++) {
    newName =  images[i];
}

    imageData.content = {
        "imageNames": getImageNames(images)
    };

    writeJSON(imageData);
    recursiveDownload(images,0);
       
}


//Request the url
//get the url and get response(res)
https.get(url, (res) => {
     console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);
    
    let document = [];

//when response has some data, and named it chunk,and put them into document array[]
    res.on('data', (chunk) => {
        document.push(chunk);
    }).on('end', () => {
        //converting the responses into a string
        //give us a html from page 
        document = Buffer.concat(document).toString();
        //console.log(document);
        createSoup(document);
    });

}).on('error', (e) => {
    console.error(e);
});

