const {initializeDatabase} = require('./db/db.connection')
const express = require("express")
const Lead = require("./models/leads.model")
const SalesAgent= require("./models/salesAgent.model")
const Tag =require("./models/tag.model")
const Comment = require("./models/comment.model")
const validator = require("validator")

const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.json())
initializeDatabase()

// const newData = {
//     name:"John Doe",
//     source:"Website",
//     salesAgent:'67d94f14dd3ee119bd1e69be',
//     status:"New",
//     tags:"Hello",
//     timeToClose:2,
//     priority:'Low',
//     createAt:17032025,
//     updateAt:18032025,
//     closedAt:20032025,
// }
// const newData = {
//     name:"John",
//     email:"John@gmail.com",
// }
// const newData={
//     name:"John"
// }
// const newData ={
//     lead:"67d94c4a658b0bfb711bbdea",
//     author:"67d9606e49b3d9ab05ec6977",
//     commentText:"Hello guys somthing is different."
// }
// async function createNewLead(newData){
//     const data = new Comment(newData)
//     const saveData =await data.save()
//     console.log(saveData)
// }
// createNewLead(newData)

app.get("/",(req,res)=>{
    res.send("Hello express")
})
app.post("/leads",async(req,res)=>{
     const data = req.body
    try{
        const {name,source,salesAgent,status,timeToClose,priority} =await data
        if(!name || !source || !salesAgent || !status || !timeToClose || !priority){
            return res.status(400).json({error:"All fields are required"})
        }
            let saleAgentValid = await SalesAgent.findOne({_id:salesAgent}).populate("author")
            if(!saleAgentValid){
               return res.status(404).json({error: `Sales agent with ID ${salesAgent} not found.`
                  })
            }  
        const savedData = new Lead(data)
      await savedData.save()
        res.status(201).json({message:"Added Successfully",savedData})
    }catch(error){
        res.status(500).json({error:"Internal Server Error"})
    }
})
app.get("/leads",async(req,res)=>{
try{
    const { salesAgent, status, tags, source } = req.query;
    let filteredLeads =await Lead.find()
    if(salesAgent){
        filteredLeads = filteredLeads.filter((leads) => leads.salesAgent == salesAgent);
    }
    if(status) {
        filteredLeads = filteredLeads.filter((leads) => leads.status === status);
      }
      if(tags) {
        const tagList = tags.split(',');
        filteredLeads = filteredLeads.filter(leads => tagList.some(tag => leads.tags.includes(tag)));
      }
      if (source) {
        filteredLeads = filteredLeads.filter(leads => leads.source === source);
      }
      res.status(200).json({
        message: 'Leads fetched successfully',
        data: filteredLeads
      });
}catch(error){
    res.status(500).json({error:"Sales agent with ID 64c34512f7a60e36df44 not found."})
}
})
app.put("/leads/:id",async(req,res)=>{
    const updateData = req.body
    const leadId = req.params.id
    try{
        let leadIdValidation = await Lead.find({_id:leadId})
        if(leadIdValidation.length === 0){
            return res.status(400).json({error:`Lead with ID ${leadId} not found`})
        }
        const updatedData = await Lead.findByIdAndUpdate(leadId,updateData,{new:true})
        res.status(202).json({message:"Update successfully",updatedData})
    }catch(error){
        res.status(500).json({error:"Internal Server Error."})
    }
})
app.delete("/leads/:id",async(req,res)=>{
    const leadId = req.params.id
    try{
        const leadIsValid = await Lead.find({_id:leadId})
        if(leadIsValid.length === 0){
            return res.status(404).json({error:`Lead with ID ${leadId} not found`})
        }
        const deletedLead = await Lead.findByIdAndDelete(leadId)
        res.status(202).json({message:"Deleted successfully",deletedLead})
    }catch(error){
        res.status(500).json({error:"Internal Server Error."})
    }
})

app.post("/agents",async(req,res)=>{
    const {name,email} = req.body
    try{
        if(!email || !name){
            return res.status(400).json({error:"All fields are required"})
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        const emailValidation = await SalesAgent.find({email})

        if(emailValidation.length>0){
            return res.status(409).json({error:`Sales agent with email ${email} already exists`})
        }
        const newAgent = new SalesAgent(req.body)
        await newAgent.save()
        res.status(201).json({message:"Agent added successfully",newAgent})
    }catch(error){
        res.status(500).json({error:"Internal server error"})
    }
})
app.get("/agents",async(req,res)=>{
    try{
        const agents = await SalesAgent.find()
        res.status(200).json(agents)
    }catch(error){
        res.status(500).json({error:"Internal Server Error"})
    }
})
app.post("/leads/:id/comments",async(req,res)=>{
    const _id = req.params.id;
    const comment = req.body;
    console.log(_id)
        try{
            const lead = await Lead.find({_id:_id})
            console.log(lead)
            // if(!lead){
            //     res.status(404).json({error:`Lead with ID ${lead} not found.`})
            // }
            // console.log(comment, lead)
            // Comment.push(comment);
            
            // Comment.save()
            res.status(200).json({message:"success",lead})
    }catch(error){
        res.status(500).json({error:"Internal Server Error",error})
    }
})
app.get("/leads/:id/comments",async(req,res)=>{
    const leadId = req.params.id
    try{
        const findedLead =await Comment.find({lead:leadId}).populate("author")
        res.status(200).json({message:"Success",findedLead})
    }catch(error){
        res.status(500).json({error:"Internal Server Error"})
    }
})
app.get("/report/lastweek",async(req,res)=>{
    try{
        const leads = await Lead.find({closedAt:{ $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } })
        if(!leads){
            res.status(404).json({error:"Any lead is not completed right now"})
        }
        res.status(202).json({
            message: "Lead completed in the last week.",leads})
        
    }catch(error){
        res.status(500).json({error:"Internal Server Error"})
    }
})

app.get("/report/pipeline",async(req,res)=>{
    try{
    const leads = await Lead.find({status:"Closed"})
    if(!leads){
        res.status(404).json({error:"Any lead is not closed right now"})
    }
    res.status(202).json({message:"Lead status is closed",leads.length})
    }catch(error){
        console.log(error)
        res.status(500).json({error:"Internal Server Error"})
    }
})

const PORT = 3000
app.listen(PORT,()=>{
    console.log(`Server is runnig on port ${PORT}`)
})