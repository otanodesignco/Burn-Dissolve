# Burn Dissolve Shader
Burn dissolve shader using simplex noise and some shader magic. This effect is using react--three-fiber. I have removed the controls for the effects for this one because it can get ugly with the min/max setting I had. I'm using fully custom shader that calculates diffuse color itself. This effect is using object space positions as the uv instead of the uv space. You can change the space to world space if you make multiple instances and want the to animate in based on their world position( staggering based on progress ). Hope you find it useful.

Burn Dissolve Demo (https://burn-dissolve.vercel.app/)



![Burn dissolve front](https://github.com/otanodesignco/Burn-Dissolve/blob/main/burn2.png?raw=true)



![Burn dissolve profile view](https://github.com/otanodesignco/Burn-Dissolve/blob/main/burn1.png?raw=true)

to use:

```
npm install

npm run dev
```

