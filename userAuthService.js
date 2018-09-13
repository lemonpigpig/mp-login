/**
 * @desc 用户信息持久化方案
 * @author lemon.he
 */
class UserAuth {
    constructor(){
        this.info = wx.getStorageSync('userAuth') || {};
    }
    get(){
        return this.info
    }
    getUserId(){
        return this.info.UserId
    }
    save(){
        wx.setStorageSync('userAuth',this.info);
    }
    set(userInfo){
        this.info = userInfo;
        this.save();
    }
    clear(){
        this.set({});
        wx.removeStorageSync('userAuth');
    }
    hasAuth(){
        return !!this.info.UserId
    }
    setUnionId(unionId){
        console.log("===================", unionId)
        wx.setStorageSync('unionId', unionId);
    }
    getUnionId(){
        return wx.getStorageSync('unionId');
    }
}

let userAuth = new UserAuth();
export default userAuth;