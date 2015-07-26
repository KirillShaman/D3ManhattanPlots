#' <D3 Manhattan Plot Visualizer>
#'
#' <Interact with yo' data!>
#'
#' @import htmlwidgets
#'
#' @export
manhattanPlot <- function(dataset, width = NULL, height = NULL,
    snps_col  = "SNP",
    pvals_col = "PVal",
    sigLine   = TRUE) {

    # create a list that contains the settings
    settings <- list(
      snps_col = snps_col,
      pvals_col = pvals_col,
      sigLine   = sigLine
    )

    #This is where data manipulation will go.
    data  = data.frame(dataset[snps_col], dataset[pvals_col])


    # pass the data and settings using 'x'
    x <- list(
      data = data,
      settings = settings
    )


  # create widget
  htmlwidgets::createWidget(
    name = 'manhattanPlot',
    x,
    width = width,
    height = height,
    package = 'manhattanPlot'
  )
}

#' Widget output function for use in Shiny
#'
#' @export
manhattanPlotOutput <- function(outputId, width = '100%', height = '400px'){
  shinyWidgetOutput(outputId, 'manhattanPlot', width, height, package = 'manhattanPlot')
}

#' Widget render function for use in Shiny
#'
#' @export
renderManhattanPlot <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  shinyRenderWidget(expr, manhattanPlotOutput, env, quoted = TRUE)
}