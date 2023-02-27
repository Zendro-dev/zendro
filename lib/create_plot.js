const fs = require("fs-extra");
const path = require("path");

/**
 * Create a plot.
 */
module.exports = async (options) => {
  const default_plots = options.default_plots;
  if (default_plots) {
    console.log("draw default plot");
    await fs.copy(
      path.normalize(__dirname + "/../plot/default_plotly_component.txt"),
      path.normalize(`./src/zendro/plots/defaultPlotlyPlot.tsx`)
    );
    await fs.copy(
      path.normalize(__dirname + "/../plot/selector.txt"),
      path.normalize(`./src/zendro/plots/data-model-field-selector.tsx`)
    );
    await fs.copy(
      path.normalize(__dirname + "/../plot/scatter_plot.txt"),
      path.normalize(`./src/pages/scatter-plot.tsx`)
    );
    await fs.copy(
      path.normalize(__dirname + "/../plot/boxplot.txt"),
      path.normalize(`./src/pages/boxplot.tsx`)
    );
    await fs.copy(
      path.normalize(__dirname + "/../plot/raincloud_plot.txt"),
      path.normalize(`./src/pages/rain-cloud-plot.tsx`)
    );
    // top menu
    let menu = await fs.readFile(
      path.normalize("./src/layouts/app/app-layout.tsx"),
      { encoding: "utf8" }
    );
    menu = menu.replace(
      `</div>`,
      `  <ClientOnly>
            {session?.user && (
              <SiteLink href="/scatter-plot" className={classes.navlink}>
                <PlotsIcon />
                <span>{'Plots'}</span>
              </SiteLink>
            )}
          </ClientOnly>
        </div>`
    );
    fs.writeFile(path.normalize("./src/layouts/app/app-layout.tsx"), menu);

    // left navigation
    let navigation = await fs.readFile(
      path.normalize("./src/layouts/models/model-layout.tsx"),
      { encoding: "utf8" }
    );
    navigation = navigation.replace(
      `const plotRoutes: any[] = [];`,
      `const plotRoutes: any[] = [];
  plotRoutes.push({
    type: 'link',
    name: 'scatter-plot',
    href: '/scatter-plot',
  });
  plotRoutes.push({
    type: 'link',
    name: 'rain-cloud-plot',
    href: '/rain-cloud-plot',
  });
  plotRoutes.push({
    type: 'link',
    name: 'boxplot',
    href: '/boxplot',
  });`
    );
    fs.writeFile(
      path.normalize("./src/layouts/models/model-layout.tsx"),
      navigation
    );
  } else {
    console.log("draw custom plot");
    const plot_name = options.plot_name;
    const plot_type = options.type;
    const menu_loc = options.menu;
    const menu_item_name = options.menu_item_name;
    console.log(plot_name, plot_type, menu_loc, menu_item_name);
    // plot page & plot component
    await fs.ensureDir(path.normalize("./src/zendro/plots"));
    if (plot_type == "plotly") {
      let page = await fs.readFile(
        path.normalize(__dirname + "/../plot/plotly_page.txt"),
        { encoding: "utf8" }
      );
      page = page.replace(/customPlotlyPlot/g, plot_name);
      fs.writeFile(path.normalize(`./src/pages/${plot_name}.tsx`), page);

      await fs.copy(
        path.normalize(__dirname + "/../plot/plotly_component.txt"),
        path.normalize(`./src/zendro/plots/${plot_name}.tsx`)
      );
    } else {
      let page = await fs.readFile(
        path.normalize(__dirname + "/../plot/d3_page.txt"),
        { encoding: "utf8" }
      );
      page = page.replace(/customD3Plot/g, plot_name);
      fs.writeFile(path.normalize(`./src/pages/${plot_name}.tsx`), page);

      await fs.copy(
        path.normalize(__dirname + "/../plot/d3_component.txt"),
        path.normalize(`./src/zendro/plots/${plot_name}.tsx`)
      );
    }
    // navigation
    if (menu_loc == "top") {
      let menu = await fs.readFile(
        path.normalize("./src/layouts/app/app-layout.tsx"),
        { encoding: "utf8" }
      );
      menu = menu.replace(
        `</div>`,
        `  <ClientOnly>
            {session?.user && (
              <SiteLink href="/${plot_name}" className={classes.navlink}>
                <PlotsIcon />
                <span>{'${menu_item_name ?? plot_name}'}</span>
              </SiteLink>
            )}
          </ClientOnly>
        </div>`
      );
      fs.writeFile(path.normalize("./src/layouts/app/app-layout.tsx"), menu);
    } else if (menu_loc == "left") {
      let menu = await fs.readFile(
        path.normalize("./src/layouts/models/model-layout.tsx"),
        { encoding: "utf8" }
      );
      menu = menu.replace(
        `const plotRoutes: any[] = [];`,
        `const plotRoutes: any[] = [];
  plotRoutes.push({ type: 'link', name: '${
    menu_item_name ?? plot_name
  }', href: '/${plot_name}' });`
      );
      fs.writeFile(
        path.normalize("./src/layouts/models/model-layout.tsx"),
        menu
      );
    } else {
      console.log("no menu");
    }
  }
};
