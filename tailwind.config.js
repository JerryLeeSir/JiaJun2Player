/** Tailwind 预编译配置 - 用于生成静态 CSS，解决电视端等环境无法运行运行时脚本的问题 */
module.exports = {
  content: [
    './*.html',
    './js/**/*.js',
    './css/**/*.css'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
