class mid {
  constructor() {
    this.BASE62 = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z"
    ]
  }
  public BASE62: string[]
  public base62Decode = function (str) {
    var num = 0
    var len = str.length
    for (var i = 0; i < len; i++) {
      var n = len - i - 1
      var s = str[i]
      num += this.BASE62.indexOf(s) * Math.pow(62, n)
    }
    return num
  }
  public base62Encode = function (num:number) {
    var str = ""
    var r = 0
    while (num !== 0 && str.length < 100) {
      r = num % 62
      str = this.BASE62[r] + str
      num = Math.floor(num / 62)
    }
    return str
  }
  public decode = function (hash:string):string {
    var id = ""
    for (var end = hash.length; end > 0; end -= 4) {
      var start = end - 4
      if (start < 0) {
        start = 0
      }
      var h = hash.substring(start, end)
      var n = String(this.base62Decode(h))
      var padding = 7 - n.length
      if (padding > 0 && start > 0) {
        // not first group and not 7 length string, must add '0' padding.
        for (; padding > 0; padding--) {
          n = "0" + n
        }
      }
      id = n + id
    }

    return id
  }
  public encode = function (id:string):string {
    id = String(id)
    if (!/^\d+$/.test(id)) {
      return id
    }

    var hash = ""
    for (var end = id.length; end > 0; end -= 7) {
      var start = end - 7
      if (start < 0) {
        start = 0
      }
      var num = id.substring(start, end)
      var h = this.base62Encode(num)
      var padding = 4 - h.length
      if (padding > 0 && start > 0) {
        // not first group and not 4 length string, must add '0' padding.
        for (; padding > 0; padding--) {
          h = "0" + h
        }
      }
      hash = h + hash
    }

    return hash
  }
}



export default new mid()
