import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";

const server = new Server({name: "travel-mcp", version: "0.1.0"}, {capabilities: {tools: {}}});

server.tool("searchFlights", {
  description: "Search flights via your Vercel proxy",
  inputSchema: { type: "object", properties: { origin:{type:"string"}, destination:{type:"string"}, depart:{type:"string"}, ret:{type:"string"}, adults:{type:"number"}, nonstop:{type:"boolean"} }, required:["origin","destination","depart"] }
}, async (input)=>{
  const r = await fetch(process.env.API_BASE+"/api/flight-search", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(input)});
  return { ok: true, content: [{ type:"json", text: JSON.stringify(await r.json()) }] };
});

server.tool("searchHotels", {
  description: "Search hotels via your Vercel proxy",
  inputSchema: { type: "object", properties: { city:{type:"string"}, checkin:{type:"string"}, checkout:{type:"string"}, rooms:{type:"number"}, pax:{type:"number"} }, required:["city","checkin","checkout"] }
}, async (input)=>{
  const r = await fetch(process.env.API_BASE+"/api/hotel-search", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(input)});
  return { ok: true, content: [{ type:"json", text: JSON.stringify(await r.json()) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
