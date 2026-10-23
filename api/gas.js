// Vercel Function: chuyển tiếp yêu cầu JSON tới Google Apps Script.
// GAS_URL đặt trong Vercel Environment Variables, KHÔNG đặt mật khẩu tại đây.
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Chỉ hỗ trợ POST'});
  const url = process.env.GAS_URL;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url))
    return res.status(503).json({ok:false,error:'Chưa cấu hình GAS_URL trên Vercel'});
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.action !== 'string')
    return res.status(400).json({ok:false,error:'Yêu cầu không hợp lệ'});
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(),25000);
    let response;
    try {
      response=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data),redirect:'follow',signal:ctrl.signal});
    } finally {clearTimeout(timer)}
    const raw=await response.text();
    let result;
    try {result=JSON.parse(raw)} catch {return res.status(502).json({ok:false,error:'Apps Script chưa trả JSON; kiểm tra quyền triển khai Web App'})}
    if (!response.ok) return res.status(502).json({ok:false,error:'Apps Script trả HTTP '+response.status});
    return res.status(200).json(result);
  } catch(e) {
    return res.status(502).json({ok:false,error:e.name==='AbortError'?'Apps Script phản hồi quá lâu':'Không thể kết nối Apps Script'});
  }
}
