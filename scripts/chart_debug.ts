
import { getChartData } from '../lib/data';
import fs from 'fs';
import path from 'path';

const alkPath = path.join(process.cwd(), 'public', 'data', 'stocks', 'ALK.json');
const alkData = JSON.parse(fs.readFileSync(alkPath, 'utf8'));

console.log(`Total history items: ${alkData.history.length}`);
console.log(`First history item:`, alkData.history[0]);
console.log(`Last history item:`, alkData.history[alkData.history.length - 1]);

const chartData = getChartData(alkData.history, 2000); // 2000 months

console.log(`Generated chart data items: ${chartData.length}`);
if (chartData.length > 0) {
    console.log(`First chart item:`, chartData[0]);
    console.log(`Last chart item:`, chartData[chartData.length - 1]);
}
