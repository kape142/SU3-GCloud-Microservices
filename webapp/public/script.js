var email = "none";

function registerEmail(){
    let input = document.getElementById("emailInput");
    document.getElementById("handlekurv").innerHTML = "";
    email = input.value
}

function buyItem(id){
    if(email=="none")
        return;
    fetch('/shoppingcart/'+email,{
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({"productid": id})
    })
        .then(() => {
            let handlekurv = document.getElementById("handlekurv")
            let div = document.createElement("div");
            div.innerHTML = document.getElementById("produkt"+id).innerHTML;
            div.style.border = "1px solid grey";
            div.style.display = "inline-block";
            div.style.margin = "10px";
            div.style.padding = "5px";
            handlekurv.appendChild(div);
        })

}

function buy(){
    if(email=="none")
        return;
    fetch('/shoppingcart/buy/'+email,{
        method: "POST"
    })
        .then(r => r.json())
        .then(obj => obj.id)
        .then(id => {
            for (let i = 1; i < 30; i++) {
                setTimeout(()=>{
                    fetch('/delivery/'+id)
                        .then(r=>r.json())
                        .then(status => document.getElementById("status").innerHTML = "Bestillingsid: "+id+",\n status: " +status.status);
                },i*1000)
            }
        });
}


window.onload = ()=>fetch('/products')
    .then(response => response.json())
    .then(list => {
        for(let i =0; i < list.length;i++){
            let btn = document.createElement("button");
            let item =  list[i];
            btn.id = "produkt"+item.produktID;
            btn.innerHTML = item.navn+": "+item.pris+",-";
            btn.onclick=()=>buyItem(item.produktID);
            document.getElementById("items").appendChild(btn)
        }
    });
