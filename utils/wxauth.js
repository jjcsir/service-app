/**
 * 微信小程序授权工具
 * 提供登录 code 获取和用户信息获取能力
 */

/**
 * 获取微信小程序登录 code
 * 用于后端调用微信 code2Session 换取 openid
 */
function getLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: res => resolve(res.code),
      fail: reject
    })
  })
}

/**
 * 获取用户信息（头像、昵称等）
 * ⚠️ 此方法只能通过 button open-type="getUserInfo" 的点击事件触发
 * 不建议直接调用，应在 UI 上放置一个按钮引导用户主动授权
 * 
 * @param {Object} userInfo - 通过 e.detail.userInfo 传入的用户信息
 * @returns {Promise<Object>} 用户信息对象
 */
function buildUserInfo(userInfo) {
  return new Promise((resolve, reject) => {
    if (userInfo && userInfo.nickName) {
      resolve(userInfo)
    } else {
      reject(new Error('未获取到用户信息'))
    }
  })
}

module.exports = { getLoginCode, buildUserInfo }
