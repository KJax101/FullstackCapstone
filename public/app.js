var mockUrlsAndCaptions = [
    {
        caption: "placeholderCaption", 
        url: "https://www.atlantisbahamas.com/media/Things%20To%20Do/Water%20Park/Beaches/Hero/WaterPark_PalmBeach.jpg"
    },
    {
        caption: "placeholderCaption1", 
        url: "https://travel.home.sndimg.com/content/dam/images/travel/fullset/2014/05/08/ac/top-10-hawaiian-beaches-waikiki.rend.hgtvcom.616.347.suffix/1491584246078.jpeg"
    },
    {
        caption: "placeholderCaption2", 
        url: "https://travel.home.sndimg.com/content/dam/images/travel/fullset/2014/05/08/ac/top-10-hawaiian-beaches-waikiki.rend.hgtvcom.616.347.suffix/1491584246078.jpeg"
    }
]


function getUrlsAndCaptions(callbackFn) {
    setTimeout(function(){ callbackFn(mockUrlsAndCaptions)}, 100);
}

// this function stays the same when we connect
// to real API later
function displayPicturesAndCaptions(data) {
    for(var i = 0; i < data.length; i++) {
   $('#showImages').append(
  `<div class="imageLayout" id="imagePlacer${i}">
   <img class="acctImage" src="${data[i].url}" id="img${i}">
   <span id="captionDisplay${i}">${data[i].caption}</span>
   <input id="captionInput${i}" style="display: none" />
   <button id="saveCaption${i}" onclick="saveCaption(this)" style="display: none">Save Caption</button>
   <button class="deleteButton" onclick="deleteImg(this)" id="deleteme${i}">Delete Image</button>
   <button class="addCaptionButton" onclick="captionImg(this)" id="captionme${i}">Caption Image</button>
   </div>`)
   }
}

function getAndDisplayUrlsAndCaptions() {
    getUrlsAndCaptions(displayPicturesAndCaptions);
}

$(function() {
    getAndDisplaySUrlsAndCaptions();
})