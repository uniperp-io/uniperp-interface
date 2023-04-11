
//format the timesteamp like 2023-01-01 20:00:00
export const makeDateText = (timestamp)=>{
  if (!timestamp)
    return "";
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

//get the time info
export const getRemainingTime = (now, endTime) => {
  if(!endTime)
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

  //const now = Date.now() / 1000; // 将当前时间转换为秒
  const remainingTime = endTime - now;

  if (remainingTime <= 0) {
    // 如果剩余时间小于等于 0，返回所有时间部分均为 0
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  // 计算剩余时间的各个时间部分
  const days = Math.floor(remainingTime / (24 * 60 * 60));
  const hours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
  const seconds = Math.floor(remainingTime % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}
