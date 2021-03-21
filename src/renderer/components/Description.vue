<template>
  <div class="content">
    <details>
      <summary>What does this program do?</summary>
      <p>
        Rich ASS Style Builder (RASB) helps you create a complex style for .ass subtitles.
        What's great about the ASS format is you can put subtitles on different layers,
        which RASB abuses to create a multi-layered, rich style.
      </p>
      <p>
        The font (fill) color of each line will be that of the style specified for that line in the input file.
        Because a certain style is required to preview, there's "Preview Style" section above.
        Every layer in the above table adds an outline, and higher index layers are placed
        <b>above</b> lower index ones. You can for example add a black layer at the bottom,
        add some blur and increase Offset Y a bit, to make a nice, realistic drop shadow.
        Or you can add a blurred layer with a light color at the bottom to make it glow.
      </p>
      <p>
        You can hit the "Show Preview" button to show an preview of your style in MPV player, 
        and it updates automatically as you tweak the layer options. If you don't have MPV
        installed, you can get it from <a href="https://mpv.io/installation/" target="_blank">here</a>.
      </p>
      <p>
        If you disable the color of a layer by unticking the checkbox, the <b>shadow color</b>
        of the style of each line will be used. You can abuse this to make the color style-dependent
        (by setting different shadow colors for styles in Aegisub).
      </p>
      <p>
        When you're done tweaking, you can apply the style on an existing ASS file, by first
        selecting input and output files, and then hitting "Apply Layers" button. This will duplicate
        each line in the source file into as many layers as you specified, into the output file. This
        means you should do this only <b>after</b> you're done editing the subtitle file in Aegisub (or
        whatever subtitle software) and ready to burn it in into a video.
        I recommend Handbrake for burning in the resulting ass file.
      </p>
    </details>
  </div>
</template>
