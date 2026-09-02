import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";

export const metadata: Metadata = {
  title: "B2B交易说明｜贝强鞋业",
  description: "贝强鞋业网站的产品资料、询价、样品、报价与正式订单边界。",
  alternates: {
    canonical: "https://www.beiqiang.online/zh/terms/",
    languages: {
      en: "https://www.beiqiang.online/terms/",
      "zh-CN": "https://www.beiqiang.online/zh/terms/",
      "x-default": "https://www.beiqiang.online/terms/",
    },
  },
  openGraph: {
    title: "B2B交易说明｜贝强鞋业",
    description: "产品资料、询价、样品、报价与正式订单边界。",
    url: "https://www.beiqiang.online/zh/terms/",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "B2B交易说明｜贝强鞋业",
    description: "产品资料、询价、样品、报价与正式订单边界。",
  },
};
export default function ChineseTermsPage() {
  return (
    <main>
      <ChineseSiteHeader englishHref="/terms/" />
      <article className="legal-page">
        <p className="eyebrow">B2B交易说明</p>
        <h1>网站帮助双方准备订单，但不自动创建正式交易。</h1>
        <section>
          <h2>产品资料</h2>
          <p>
            网站图片、款号、尺码和材料方向用于第一轮采购审核。价格、MOQ、库存或生产状态、材料执行、颜色尺码配比、包装、测试、交期和物流必须按具体项目书面确认。只有已经由对应产品资料确认的款式，才会使用“宽鞋头”等特定描述。
          </p>
        </section>
        <section>
          <h2>私标概念预览</h2>
          <p>
            Logo或品牌文字预览只记录买家视觉目标，不确认图稿权利、Logo工艺、位置、尺寸、颜色、成本、模具、材料兼容性或生产可行性。相关事项必须经过工厂审核，并在适用时通过样品和书面文件确认后才能进入正式订单。
          </p>
        </section>
        <section>
          <h2>询盘、样品与报价</h2>
          <p>
            提交询盘、加入询价单、下载资料、分享产品、确认样品或接受网站报价均不自动构成生产订单。样品用于验证双方写明的范围、交付物、标准和排除项；买家填写的目标成本、价格方向或技术目标在工厂审核、正式报价和实际样品/测试前，不是贝强已确认价格、接受条件或生产能力。
          </p>
        </section>
        <section>
          <h2>样品可行性申请</h2>
          <p>
            提交样品申请只是请贝强审核所选款号、申请范围、寄送地点和时间，不确认样品可供性、样品费、运费、准备时间、规格、技术表现、测试结果、知识产权接受或大货订单。上述内容必须经过可行性审核并另行书面确认。
          </p>
        </section>
        <section>
          <h2>采购会议</h2>
          <p>
            候选时间是买家按自身当地时间提交的选项。只有贝强另行确认具体时间、时区和方式后，会议才成立。会议讨论、屏幕共享、聊天或会议摘要不确认规格、能力、样品批准、价格、付款、生产或订单；相关内容必须另行写入适用的书面报价、Trade
            Assurance订单或签署合同后才具有相应商业效力。下载的iCalendar文件只是由买家控制的个人日程副本，不会同步双方日历、报告出席情况或在会议取消后自动更新。买家提交改期或取消申请不会立即改变原确认会议；贝强批准改期后，买家应重新下载当前日历文件。
          </p>
        </section>
        <section>
          <h2>买家团队协作</h2>
          <p>
            已核验的买家可以申请让采购、跟单、运营、财务、管理层或采购代理同事查看本项目的买家安全摘要。提交申请不会自动开通权限；贝强会另行核验，并可批准或拒绝。已批准的工作区角色不代表其有权确认样品、接受报价、修改订单或授权付款，敏感操作仍需项目私密查询码，正式权限仍以Alibaba
            Trade Assurance订单或双方签署合同为准。
          </p>
        </section>
        <section>
          <h2>正式订单与付款</h2>
          <p>
            正式交易通过Alibaba Trade
            Assurance订单或双方签署的合同完成。订单准备资料包仅用于结构化收集并人工审核买方公司、账单、收货、进口责任、文件和PO信息；无论状态为已提交还是已审核，都不构成已接受采购单、发票、付款指令、库存预留或生产授权。下单前书面核对草案允许买家逐项接受八项内容或准确指出修订字段；接受只形成网站审核记录，不建立采购单、发票、付款要求、库存预留或生产授权。生产、付款、价格、数量、规格、包装和交付义务以双方核实后的正式文件为准。网站不收集银行卡密码、短信验证码或信用卡付款资料。
          </p>
        </section>
        <section>
          <h2>贸易术语与物流</h2>
          <p>
            EXW、FOB、FCA或DDP请求需要指定地点、数量和包装资料。除非书面报价明确包含，产品价格与运费分开；DDP清关、关税、税费和当地交付在货代确认前不作承诺。
          </p>
        </section>
        <section>
          <h2>联系方式</h2>
          <p>
            订单资料或条款问题请联系{" "}
            <a href="mailto:421345308@qq.com">421345308@qq.com</a> 或 WhatsApp
            +86 189 5980 5256。
          </p>
        </section>
      </article>
      <ChineseSiteFooter />
    </main>
  );
}
