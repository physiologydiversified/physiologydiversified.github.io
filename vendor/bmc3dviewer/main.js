/****************************
*
* BMC_3DViewer v0.003
* Author: Michael Corrin
* 2024-10-18 1740
*
******************************/

import * as THREE from "./threejs/three.module.js";
import { OrbitControls } from './threejs/OrbitControls.js';
import WebGL from './threejs/WebGL.js';
import { GLTFLoader } from './threejs/GLTFLoader.js';
// import { BmcUtils } from  '/BMC_utils.js';

console.log("***** BMC_3DViewer 2024-10-18 1740 *****");

// import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import WebGL from 'three/addons/capabilities/WebGL.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { TransformControls } from 'three/addons/controls/TransformControls.js';
// import { BmcUtils } from  '/BMC_utils.js';


/**
 * ImportDataModel is a class to hold data about the 
 * imported three dimensional model. This includes 
 * the file path to the resource as well as information
 * about the position and content of the labels.
 */
class ImportedDataModel {
    constructor(_ind, _filePath, _name=undefined) {
        this.index = _ind;
        this.filePath = _filePath;
        this.name = _name; // holds name of model, can be used in load btn and elsewhere
        this.loaded = false;
        this.gltf = undefined;
        this.labels = []; // holds Label3D instances
    }
}

/**
 * Label3D holds data about the
 * coordinates of a label on a 
 * 3D object. Data in instances 
 * of these objects is used to 
 * create projections onto a 2D
 * viewport plane and the actual 
 * labels are rendered using SVG 
 * @class
 */
class Label3D {
    constructor($position_v3, $label_str) {
        this.position = $position_v3;
        this.labelText = $label_str;
        // stores a vector describing the direction
        // the label is facing. The mesh that is used
        // to create the label should be oriented with
        // its Y-axis facing the appropriate direction.
        // Think of it as a surface normal.
        this.direction = undefined;
    }
    setDirection($Vector3) {
        this.direction = $Vector3;
    }
}
/**
 * Example: In C4D name the object "label_right_humerus"
 */
Label3D.labelPrefix = "label_";

/**
 * Label2DView is a class that describes
 * a single graphic label. This label is 
 * constructed using SVG and must be added
 * to an SVG element. It is part of the View
 * @class
 */
class Label2DView {
    /**
     * 
     * @param {Label3D} $label3d
     * @constructor
     */
    constructor($label3d)
    {
        this.textEl = document.createElementNS(SVGLabelView.xmlns, "text");
        this.textEl.setAttributeNS(null, "x", 5);
        this.textEl.textContent = $label3d.labelText;
        this.groupEl = document.createElementNS(SVGLabelView.xmlns, "g");
        this.textBgEl = document.createElementNS(SVGLabelView.xmlns, "rect");
        this.textBgEl.setAttributeNS(null, "x", 0);
        this.circleEl = document.createElementNS(SVGLabelView.xmlns, "circle");
        this.circleEl.setAttributeNS(null, "cx", 0);
        this.circleEl.setAttributeNS(null, "cy", 0);
        this.circleEl.setAttributeNS(null, "r", 5);
        this.leaderLineEl = document.createElementNS(SVGLabelView.xmlns, "line");
        this.leaderLineEl.setAttributeNS(null, "x1", 0);
        this.leaderLineEl.setAttributeNS(null, "y1", 0);
        this.leaderLineEl.setAttributeNS(null, "x2", 0);
        this.leaderLineEl.setAttributeNS(null, "y2", 0);
        this.groupEl.append(this.textBgEl);
        this.groupEl.appendChild(this.textEl);
    }
    /**
     * refreshText is a function that ensures that the label
     * svg text element and the background element are aligned
     */
    refreshText() {
        this.textDims = this.textEl.getBoundingClientRect();
        this.bgDims = this.textBgEl.getBoundingClientRect();
        this.textEl.setAttributeNS(null, "y", this.textDims.height);
        this.textEl.setAttributeNS(null, "y", 0);
        // BmcUtils.objPropsToConsole(this.textDims);
        this.textBgEl.setAttributeNS(null, "width", this.textDims.width * 1.2);
        this.textBgEl.setAttributeNS(null, "height", this.textDims.height * 1.2);
        this.textBgEl.setAttributeNS(null, "y", -this.textDims.height);
    }
    updateLabelView($label3d, $cameraDirectionV3, $camera, $halfContW, $halfContH) {
        const _labelPos = $label3d.position.clone();
        const posScrnSpc = _labelPos.project($camera);
        const _x = posScrnSpc.x * $halfContW + $halfContW;
        const _y = -1 * posScrnSpc.y * $halfContH + $halfContH;
        this.groupEl.setAttributeNS(null, "transform", `translate(${_x+11} ${_y})`);
        this.circleEl.setAttributeNS(null, "cx", _x);
        this.circleEl.setAttributeNS(null, "cy", _y);
        if ($label3d.direction) {
            // decide if label should be shown or hidden
            let _r = $cameraDirectionV3.dot($label3d.direction);
            if (_r > 0) {
                // this.circleEl.setAttributeNS(null, "r", 10);
                // hidden
                this.groupEl.classList.add("hidden");
                this.circleEl.classList.add("hidden");
            } else {
                // this.circleEl.setAttributeNS(null, "r", 100);
                // visible
                this.groupEl.classList.remove("hidden");
                this.circleEl.classList.remove("hidden");
            }
        }
    }
}

/**
 * SVGLabelView is a class that defines the SVG
 * container that holds 2D SVG labels. Use it to
 * add or remove labels from the SVG label overlay.
 * @class
 */
class SVGLabelView {
    /**
     * 
     * @param {Array} $importedDataModels array of ImportedDataModel instances
     * @constructor
     */
    constructor($importedDataModels, $containerElement) {
        /**
         * viewLabels is a Map instance that creates
         * bindings between an instance of ImportedDataModel
         * and a Map instance (that Map binds a Label3D 
         * instance with a Label2DView instance)
         * @property
         * @private
         */
        this.viewLabels = new Map();

        // Bind the application data model 
        // (saved in ImportedDataModel instances) with
        // Map instances that create a connection 
        // between the data models for the individual 
        // labels and the label View
        for (let i = 0; i < $importedDataModels.length; i++) {
            const importedDataModel = $importedDataModels[i];
            this.viewLabels.set(importedDataModel, new Map());
            // example: viewLabels.set(models[0], new Map());
        }
        //
        // const xmlns = "http://www.w3.org/2000/svg";
        this.width = $containerElement.getBoundingClientRect().width;
        this.height = $containerElement.getBoundingClientRect().height;
        this.svgLabels = document.createElementNS(SVGLabelView.xmlns, "svg");
        this.svgLabels.setAttributeNS(null, "viewBox", "0 0 " + this.width + " " + this.height);
        this.svgLabels.setAttributeNS(null, "width", this.width);
        this.svgLabels.setAttributeNS(null, "height", this.height);
        this.svgLabels.style.display = "block";
        this.svgLabels.style.position = "absolute";
        this.svgLabels.style.left = 0;
        this.svgLabels.style.top = 0;
    }

    /**
     * addLabelView adds the SVG elements described by
     * a single Label2DView to the SVG container.
     * @method
     * @param {Label2DView} $label2DView 
     */
    addLabelView($label2DView) {
        this.svgLabels.append($label2DView.groupEl);
        this.svgLabels.append($label2DView.circleEl);
        this.svgLabels.append($label2DView.leaderLineEl);
        $label2DView.refreshText();
    }

    /**
     * removeLabelView removes the SVG elements described by
     * a single Label2DView from the SVG container.
     * @method
     * @param {Label2DView} $label2DView 
     */
    removeLabelView($label2DView) {
        this.svgLabels.removeChild($label2DView.groupEl);
        this.svgLabels.removeChild($label2DView.circleEl);
        this.svgLabels.removeChild($label2DView.leaderLineEl);
    }
    
    hideLabels() 
    {
        this.svgLabels.classList.add("hidden");
    }
    revealLabels()
    {
        this.svgLabels.classList.remove("hidden");
    }
}
SVGLabelView.xmlns =  "http://www.w3.org/2000/svg";

/**
 * SVGPreloader is part of the View. It creates and contains functions for displaying an SVG-based
 * preloader graphic. It can be updated with information about loadiing progress.
 * @class
 */
class SVGPreloader {
    /**
     * @constructor
     */
    constructor() {
        this.preloadBarWidth = 100;
        this.preloadBarHeight = 20;
        this.outerBox = document.createElementNS(SVGLabelView.xmlns, "rect");
        this.outerBox.setAttributeNS(null, 'width', this.preloadBarWidth);
        this.outerBox.setAttributeNS(null, 'height', this.preloadBarHeight);
        this.outerBox.setAttributeNS(null, 'fill', "none");
        // this.outerBox.setAttributeNS(null, 'stroke', "none");
        this.innerBox = document.createElementNS(SVGLabelView.xmlns, "rect");
        this.innerBox.setAttributeNS(null, 'width', this.preloadBarWidth);
        this.innerBox.setAttributeNS(null, 'height', this.preloadBarHeight);
        this.innerBox.classList.add("innerLoadBar");
        this.text = document.createElementNS(SVGLabelView.xmlns, "text");
        this.text.textContent = "Loading 3D model..."
        this.group = document.createElementNS(SVGLabelView.xmlns, "g");
        this.group.append(this.innerBox);
        this.group.append(this.outerBox);
        this.group.append(this.text);
        this.group.classList.add("preloader");
    }
    /**
     * adds the preloader to an existing SVGSVGElement
     * @param {SVGSVGElement} $svgContainer 
     * @returns {Boolean} Returns true if element added successfully, returns false if it isn't
     */
    add($svgContainer) {
        let _dims;
        if (!($svgContainer instanceof SVGElement)) return false;
        if ($svgContainer instanceof SVGSVGElement) 
        {
            if ($svgContainer.getAttributeNS(null, "viewBox") !== null)
            {
                // parse the viewbox attribute
                const _viewDims = $svgContainer.getAttributeNS(null, "viewBox").split(" ");
                _dims = {width:(parseFloat(_viewDims[2]) - parseFloat(_viewDims[0])), height:(parseFloat(_viewDims[3]) - parseFloat(_viewDims[1]))}
            } 
            else 
            {
                _dims = $svgContainer.getBoundingClientRect();
            }
            
        }
        else 
        {
            _dims = $svgContainer.getBoundingClientRect();
        }
        const _x = (_dims.width - this.preloadBarWidth) / 2;
        const _y = (_dims.height - this.preloadBarHeight) / 2;
        this.group.setAttributeNS(null, "transform", `translate(${_x} ${_y})`);
        $svgContainer.append(this.group);
        return true;
    }
    /**
     * removes the preloader from an existing SVGSVGElement
     * @param {SVGSVGElement} $svgContainer 
     */
    remove($svgContainer) {
        this.group.remove($svgContainer);
    }
    /**
     * update is called to update the loader graphic with data about the current loading state
     * @param {Number} $percentLoaded A value between 0-100 (percentage as an integer)
     */
    update($percentLoaded)
    {
        const _w = parseInt($percentLoaded/100 * this.preloadBarWidth);
        this.innerBox.setAttribute('width', _w);
    }
}

/**
 * 
 * @class
 */
class BMC_3DViewer {
    constructor($container) {
        
        // this.contain = document.querySelector("div.bmc_3dviewer");
        this.contain = $container;
        this.containDimensions = this.contain.getBoundingClientRect();

        // Create the debug elements and attach them to the 
        // container that is attached if this is an instance
        // with the debugger/extra info enabled.
        this.debugContain = document.createElement("div");
        this.debugContain.classList.add("debugger");
        this.debugControlsLi = document.createElement("li");
        this.debugOrthoZoomLi = document.createElement("li");
        // this.debugPersZoomLi = document.createElement("li");
        this.debugCamPosLi = document.createElement("li");
        this.debugTargPosLi = document.createElement("li");
        this.debugContain.appendChild(document.createElement("h2")).textContent = "Debug";
        this.debugContain.appendChild(this.debugControlsLi);
        this.debugContain.appendChild(this.debugOrthoZoomLi);
        // this.debugContain.appendChild(this.debugPersZoomLi);
        this.debugContain.appendChild(this.debugCamPosLi);
        this.debugContain.appendChild(this.debugTargPosLi);

        // This array will store instances of ImportedDataModel.
        // This data is contained in the 'src' attribute of the 
        // container element and will also be added to once the 
        // glb/gltf files are loaded.
        this.models = [];
        this.presetViews;
        this.presetViewsBtns;
        this.presetViewMap;
        // Holds a integer value that corresponds
        // to the current index value of the data
        // model that is currently being displayed.
        this.visibleModelIndex = undefined;
        // Holds a integer value that corresponds
        // to the current index value of the data
        // model that is currently being loaded.
        this.loadingModelIndex = undefined;

        // Parse the data-src attribute of the container element
        if (this.contain.dataset.src) {

            const _srcString = this.contain.dataset.src;
            // Check if this is a JSON string holding an array
            // If it is a JSON string with an array, it should begin and end with []
            if (_srcString.charAt(0) == "[" && _srcString.charAt(_srcString.length-1) == "]") 
                {
                    // Looks like we have a JSON array
                    // Is it structured correctly? Comma separated strings or a series of objects
                    // e.g. #1: ["path/filename.glb", "path/filename2.glb"] 
                    // e.g. #2: [{path:"path/file1.glb", name:"model 1"}, {path:"path/file2.glb", name:"model 2"}]
                    console.log("JSON-like []");
                    // Parse with JSON tools
                    const _importedArr = JSON.parse(_srcString);
                    // Check each object in array and create ImportedDataModel instances
                    // based on type of entry.
                    for (let _i = 0; _i < _importedArr.length; _i++) {
                        const _value = _importedArr[_i];
                        if (typeof(_value) === "string") 
                        {
                            if (!_value.endsWith(".glb")) {
                                console.log(`Invalid glb file name: ${_value.path}, Skipped adding to component `);
                            } else {
                                const _filePath = _value.replaceAll(" ", "");
                                // Make ImportedDataModel
                                console.log("Make new ImportedDataModel: string path found: " + _filePath);
                                this.models[_i] = new ImportedDataModel(_i, _filePath);
                            }
                        } else if (typeof(_value) === "object" && !Array.isArray(_value)) {
                            // Check if object has a 'path' property and is valid (a string)
                            if (_value.path && typeof(_value.path) === "string" ) {
                                // Check if GLB file suffix provided
                                if (!_value.path.endsWith(".glb")) {
                                    console.log(`Invalid glb file name: ${_value.path}, Skipped adding to component `);
                                } else {
                                    // Name of glb file appears to be valid, add to loading list
                                    let _filePath = _value.path.replaceAll(" ", "");
                                    let _name = undefined;
                                    // check if object has 'name' property. 
                                    if (_value.name && typeof(_value.name) === "string" ) {
                                        _name = _value.name;
                                    }
                                    // Create ImportedDataModel
                                    console.log("Make new ImportedDataModel: string path found: " + _filePath + ", name: " + _name);
                                    this.models[_i] = new ImportedDataModel(_i, _filePath, _name);
                                 } 
                            }
                        } else {
                            console.log("data-src entry malformed and was skipped.")
                        }
                    }
                } else {
                    console.log("non JSON-like");
                    // This is a simple comma separated list or is a single item
                    const _srcStrings = _srcString.split(",");
                    for (let _srcIndex = 0; _srcIndex < _srcStrings.length; _srcIndex++) {
                        // Make sure file path is minimally valid
                        if (!_srcStrings[_srcIndex].endsWith(".glb")) {
                            console.log(`Invalid glb file name: ${_srcStrings[_srcIndex]}, skipped adding to component.`);
                        } else {
                            const _filePath = _srcStrings[_srcIndex].replaceAll(" ", "");
                            // this.models[_srcIndex] = new ImportedDataModel(_srcIndex, _filePath);
                            console.log("Make new ImportedDataModel: string path found: " + _filePath);
                            this.models[_srcIndex] = new ImportedDataModel(_srcIndex, _filePath);
                        }
                        
                    }
                }
                // TODO Get rid of old code in comments 2024-10-18
            // OLD START: 
            // const _srcStrings = _srcString.split(",");
            // for (let _srcIndex = 0; _srcIndex < _srcStrings.length; _srcIndex++) {
            //     // TODO Make sure file path is valid
            //     const _filePath = _srcStrings[_srcIndex];
            //     this.models[_srcIndex] = new ImportedDataModel(_srcIndex, _filePath);
            // }
            // OLD END
        } else {
            console.warning("BMC Model Viewer: No mesh data source provided. Should provide URL to glb/gltf file");
        }
        if (this.contain.dataset.orientations) {
            // TODO Check if properly formated JSON
            const _presetViewsJson = this.contain.dataset.orientations;
            this.presetViews = JSON.parse(_presetViewsJson);
            // console.log(this.presetViews);

            this.presetViewsBtns = [];
            this.presetViewMap = new Map();
            // Create the view elements that will be added later
            for (let i = 0; i < this.presetViews.length; i++) {
                const _obj = this.presetViews[i];
                const _btnEl = document.createElement('input');
                _btnEl.setAttribute("type", "button");
                _btnEl.setAttribute("value", _obj.label);
                this.presetViewMap.set(_btnEl, this.presetViews[i]);
                this.presetViewsBtns[i] = _btnEl;
            }
        }

        /**
        * Boolean, used to determine if debug helpers should be shown
        */
        this._debug = false;
        if (this.contain.dataset.debug)
        {
            this._debug = this.contain.dataset.debug === "true" ? true: false;
        }

        ///////////////////////////////////////////////////
        //
        // Scene build in Threejs
        //
        //////////////////////////////////////////////////
        /**
         * Boolean, used to determine if a perspective or
         * orthographic camera will be used for the viewer
         */
        this._isPersp;
        /**
         * THREEJS scene
         */
        this.scene;
        // Intantiate a new THREEJS scene
        this.scene = new THREE.Scene();
        if (this._debug === true) this.scene.add( new THREE.AxesHelper( 3 ) );
        /**
         * Holds reference to a Threejs camera instance
         */
        this.camera;
        /**
         * Holds a reference to the THREEJS camera that is currently being used to render
         */
        this.activeCamera;
        /**
         * Used to scale the ortho cam.
         */
        this.frustumSize;
        /**
         * Aspect ratio of the container that will hold the Threejs canvas
         */
        this.widthHeightRatio = this.containDimensions.width / this.containDimensions.height;

        // starting position of persp cam, starting size ortho cam 
        this._camStartPos;
        this._camStartSize;

        // for orthocam (OrbitControls)
        this._zoomEnabled = true; // default
        this._minZoom;
        this._maxZoom;

        // for perspective (OrbitControls)
        this._minDistance;
        this._maxDistance;

        // for reset camera position button
        // reset-view-btn
        this._hasResetCameraBtn = false; // default
        if (this.contain.dataset.resetViewBtn) 
        {
            this._hasResetCameraBtn = this.contain.dataset.resetViewBtn === "true" ? true: false;
        }

        // Setup the camera type that will be used
        // The default value for the type of camera used 
        // ortho camera is the default camera
        this._isPersp = false;
        if (this.contain.dataset.useOrthoCam)
        {
            this._isPersp = this.contain.dataset.useOrthoCam === "true" ? false: true;
        }
        this._camStartPos = new THREE.Vector3(0,0,5);
        // TODO Keep this or use the initialOrientation data attribute?
        if (this.contain.dataset.camStartPos)
            {
                const _camStartPosArr = this.contain.dataset.camStartPos.split(",");
                this._camStartPos.set(parseFloat(_camStartPosArr[0]), parseFloat(_camStartPosArr[1]), parseFloat(_camStartPosArr[2]));
            }
        // Set the default size of the ortho camera
        this.frustumSize = 5;
        if (this.contain.dataset.orthoCamSize) 
        {
            this.frustumSize = parseFloat(this.contain.dataset.orthoCamSize);
        }

        if (this._isPersp) {
            this.camera = new THREE.PerspectiveCamera( 75, this.widthHeightRatio, 0.1, 1000 );
            this.camera.position.setX(this._camStartPos.x);
            this.camera.position.setY(this._camStartPos.y);
            this.camera.position.setZ(this._camStartPos.z);
        } 
        else 
        {
            this.camera = new THREE.OrthographicCamera( this.frustumSize * this.widthHeightRatio / - 2, this.frustumSize * this.widthHeightRatio / 2, this.frustumSize / 2, this.frustumSize / - 2, -100, 100 );
            this.camera.up.set(0,1,0);
            this.camera.position.set(0,0,10);
            // If provided, rotate to initial value
            if (this.contain.dataset.initialOrientation) 
                {
                    console.log(this.contain.dataset.initialOrientation);
                    const _initOrient = JSON.parse(this.contain.dataset.initialOrientation);
                    this.camera.position.set(_initOrient.x,_initOrient.y,_initOrient.z);
                }
        }


        // 
        this._backgroundColour;
        // Set the background colour of the scene
        this._backgroundColour = 0xffffff;
        if (this.contain.dataset.backgroundColour)
        {  
            // check string length and presencce of hex '0x' 
            if (this.contain.dataset.backgroundColour.startsWith("0x") && this.contain.dataset.backgroundColour.length) 
            {
                this._backgroundColour = parseInt(this.contain.dataset.backgroundColour);
            }
            else
            {
                console.warn("BMC_Viewer: background-colour attribute needs a valid hex value that starts with 0x (e.g., 0x000000 is black)");
            }
            
        }
        this.scene.background = new THREE.Color(this._backgroundColour );

        ////////////////////
        //
        // Renderer vars
        //
        ///////////////////
        // Should the renderer be set to antialias
        // Default is false
        this._antialias = false;
        if (this.contain.dataset.antiAlias) 
        {
            this._antialias = this.contain.dataset.antiAlias === "true" ? true:false;
        }

        this.renderer = new THREE.WebGLRenderer({antialias:this._antialias});
        // renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setSize( this.containDimensions.width, this.containDimensions.height );

        // Add the renderer to the element that it 
        // should be displayed within.
        // document.body.appendChild( renderer.domElement );
        this.contain.appendChild( this.renderer.domElement );

        this.svgLabelView = new SVGLabelView(this.models, this.contain);
        // this.contain.appendChild( this.svgLabels );
        this.contain.appendChild( this.svgLabelView.svgLabels );
        
        this.controlOverlay = document.createElement("div");
        this.controlOverlay.classList.add("overlay");
        this.contain.appendChild(this.controlOverlay);

        if (this._debug === true) this.contain.appendChild( this.debugContain );

        this.ambLight = new THREE.AmbientLight( 0x707070 ); // soft white light
        this.scene.add( this.ambLight );
        /**
         * directionalLightIntense is the intensity value of the key light. Default is 1.
         * @property {Number}
         * @type Number
         */
        this.keylightIntensity = 1;
        this.filllightIntensity = 0.2; 
        if (this.contain.dataset.keyLightIntensity !== undefined) 
        {
            // Check that only a float or int value
            const _val = parseFloat(this.contain.dataset.keyLightIntensity);
            if (!isNaN(_val)) 
            {
                
                this.keylightIntensity = _val;
            }
        }
        if (this.contain.dataset.fillLightIntensity !== undefined) 
            {
                // Check that only a float or int value
                const _val = parseFloat(this.contain.dataset.fillLightIntensity);
                if (!isNaN(_val)) 
                {
                    
                    this.filllightIntensity = _val;
                }
            }
        this.directionalLight = new THREE.DirectionalLight(0xffffff, this.keylightIntensity);
        this.directionalLight.position.set( 0,0,0);
        this._dirLightTarget = new THREE.Object3D();
        this._keyLightHelper = new THREE.DirectionalLightHelper( this.directionalLight, 0.5 );
        this._dirLightTarget.position.set(2,-2,-4);
            

        this.fillLight = new THREE.DirectionalLight(0xffffff, this.filllightIntensity);
        this.fillLight.position.set( 0, 0, 0 );
        this._fillLightTarget = new THREE.Object3D();
        this._fillLightHelper = new THREE.DirectionalLightHelper( this.fillLight, 0.5, 0xFF0000 );
        this._fillLightTarget.position.set(-2,-1,0);

        this.lightGroup = new THREE.Group();
        this.lightGroup.add( this.fillLight );
        //this.lightGroup.add( this._fillLightHelper );
        this.lightGroup.add( this.directionalLight );
        //this.lightGroup.add( this._keyLightHelper );
        
        // this.spotLight = new THREE.SpotLight( 0xffffff, 100 );
        // this.spotLight.position.set( -5, 2, -4 );
        // Fixed light
        // scene.add( spotLight );
        this.debugFrustrumSize = this.frustumSize * 5;
        this.debugCamera = new THREE.OrthographicCamera( this.debugFrustrumSize * this.widthHeightRatio / - 2, this.debugFrustrumSize * this.widthHeightRatio / 2, this.debugFrustrumSize / 2, this.debugFrustrumSize / - 2, -10000, 100000 );
        this.debugCamera.up.set(0,1,0);
        this.debugCamera.position.set(0,10,0);
        this.debugCamera.lookAt(new THREE.Vector3(0,0,0));
        this.camHelper = new THREE.CameraHelper( this.camera );

        this.scene.add( this.debugCamera );
        this.activeCamera = this.camera;
        this.scene.add( this.camera );
        

        if (this.contain.dataset.lightsBoundCamera === undefined || this.contain.dataset.lightsBoundCamera === "true")
        {
            // Light moves with camera
            this.camera.attach(this._fillLightTarget);
            this.camera.attach(this._dirLightTarget);
            this.fillLight.target = this._fillLightTarget;
            this.directionalLight.target = this._dirLightTarget;
            this.camera.attach(this.lightGroup);
            // this.camera.attach( this._keyLightHelper );
            // this.camera.attach( this._fillLightHelper );
        }
        else 
        {
            // Light fixed in scene relative to objects
            this.scene.add(this.lightGroup);
        }
        
        // Add the controls that are used to rotate the scene/object
        this.controls = new OrbitControls( this.camera, this.controlOverlay );
        // Based on attribute settings for the component,
        // make adjustments to the controls.
        if (this.contain.dataset.minZoom) 
        {
            this._minZoom = parseFloat(this.contain.dataset.minZoom);
            this.controls.minZoom = this._minZoom;
        }
        if (this.contain.dataset.maxZoom) 
        {
            this._maxZoom = parseFloat(this.contain.dataset.maxZoom);
            this.controls.maxZoom = this._maxZoom;
        }
        if (this.contain.dataset.minDistance)
            {
                this._minDistance = parseFloat(this.contain.dataset.minDistance);
                this.controls.minDistance = this._minDistance;
            }
        if (this.contain.dataset.maxDistance) 
            {
                this._maxDistance = parseFloat(this.contain.dataset.maxDistance);
                this.controls.maxDistance = this._maxDistance;
            }
        if (this.contain.dataset.disableZoom) 
        {
            this._zoomEnabled = this.contain.dataset.disableZoom === "true" ? false: true;
            this.controls.enableZoom = this._zoomEnabled;
        }

        // See if values provided to constrain rotation (side to side, around Y axis)
        // These values should be from 3.14 to -3.14
        if (this.contain.dataset.maxHorOrbit && this.contain.dataset.minHorOrbit)
        {
            this.controls.maxAzimuthAngle =  parseFloat(this.contain.dataset.maxHorOrbit);
            this.controls.minAzimuthAngle =  parseFloat(this.contain.dataset.minHorOrbit);
        } 
        else if (this.contain.dataset.maxHorOrbit && !this.contain.dataset.minHorOrbit)
        {
            this.controls.maxAzimuthAngle =  parseFloat(this.contain.dataset.maxHorOrbit);
            this.controls.minAzimuthAngle = -1 * (parseFloat(this.contain.dataset.maxHorOrbit));
        }
        else if (!this.contain.dataset.maxHorOrbit && this.contain.dataset.minHorOrbit) 
        {
            this.controls.maxAzimuthAngle =  parseFloat(this.contain.dataset.minHorOrbit);
            this.controls.minAzimuthAngle = -1 * (parseFloat(this.contain.dataset.minHorOrbit));
        }

        // See if values provided to constrain vertical rotation (top to bottom)
        // These values should be from 3.14 to -3.14
        if (this.contain.dataset.maxHorOrbit && this.contain.dataset.minHorOrbit)
        {
            this.controls.maxPolarAngle = parseFloat(this.contain.dataset.maxVertOrbit);
            this.controls.minPolarAngle = parseFloat(this.contain.dataset.minVertOrbit);
        } 
        else if (this.contain.dataset.maxVertOrbit && !this.contain.dataset.minVertOrbit)
        {
            this.controls.maxPolarAngle =  Math.PI/2 + parseFloat(this.contain.dataset.maxVertOrbit);
            this.controls.minPolarAngle = Math.PI/2 - parseFloat(this.contain.dataset.maxVertOrbit);
        }
        else if (!this.contain.dataset.maxVertOrbit && this.contain.dataset.minVertOrbit) 
        {
            this.controls.maxPolarAngle =  Math.PI/2 + parseFloat(this.contain.dataset.minVertOrbit);
            this.controls.minPolarAngle = Math.PI/2 - parseFloat(this.contain.dataset.minVertOrbit);
        }

        if (this.contain.dataset.orbitCam) {
            if (this.contain.dataset.orbitCam === "false") {
                this.controls.enabled = false;
            }
        }
        // TODO Consider adding tool to transform model in Debug mode
        if (this.contain.dataset.orbitCam && this.contain.dataset.orbitCam === "false") {
            // this.transControls = new TransformControls( this.camera, this.controlOverlay );
        }
        
        
        

        //
        // objPropsToConsole(this.controls);

        this.loader = new GLTFLoader();
        this.preloaderGraphic = new SVGPreloader();

        /////////////////
        // Label toggle
        ////////////////
        this.labelsOn = true;
        this.labelToggleContain = document.createElement("div");
        this.labelToggleEl = document.createElement("input");
        this.labelToggleLabel = document.createElement("label");
        this.labelToggleEl.setAttribute("type", "checkbox");
        this.labelToggleEl.setAttribute("checked", "checked");
        this.labelToggleContain.classList.add("labelToggle");
        this.labelToggleContain.classList.add("hidden");
        this.labelToggleLabel.textContent = "Labels";
        this.labelToggleLabel.appendChild(this.labelToggleEl);
        this.labelToggleContain.appendChild(this.labelToggleLabel);
        this.contain.appendChild(this.labelToggleContain);

        this.labelToggleEl.addEventListener("click", this.labelToggleClick.bind(this));

        /////////////////////////
        // Reset camera position
        ////////////////////////
        this.cameraControlsDiv = document.createElement("div");
        this.cameraControlsDiv.classList.add("cameraControls");
        // TODO Only create if this._hasResetCameraBtn === true
        if (this._hasResetCameraBtn === true) {
            this.cameraResetBtn = document.createElement("input");
            this.cameraResetBtn.setAttribute("type", "button");
            this.cameraResetBtn.setAttribute("value", "Reset camera");
            this.cameraControlsDiv.appendChild(this.cameraResetBtn);
            this.cameraResetBtn.addEventListener("click", this.resetCameraClick.bind(this));
        }
       

        this.presetViewsBtns;
        this.presetViewMap;
        if (this.presetViewsBtns) {
            for (let i = 0; i < this.presetViewsBtns.length; i++) {
                const _btnEl = this.presetViewsBtns[i];
                this.cameraControlsDiv.appendChild(_btnEl);
                _btnEl.addEventListener("click", this.moveCameraClick.bind(this));
            }
        }
        

        this.cameraToggleBtn = document.createElement("input");
        this.cameraToggleBtn.setAttribute("type", "button");
        this.cameraToggleBtn.setAttribute("value", "Toggle camera");

        
        this.cameraToggleBtn;
        if (this._debug === true) {
            // this.cameraToggleBtn = document.createElement("input");
            // this.cameraToggleBtn.setAttribute("type", "button");
            // this.cameraToggleBtn.setAttribute("value", "Toggle camera");
            // this.cameraControlsDiv.appendChild(this.cameraToggleBtn);
            // this.cameraToggleBtn.addEventListener("click", this.toggleActCamBtnClicked.bind(this));
        }
        

        ///////////////////
        // Load models buttons
        ///////////////////
        this.loadBtnContainer = document.createElement("div");
        this.loadBtnContainer.classList.add("loadButtonContainer");
        // attribute: data-load-button-overlay
        if (this.contain.dataset.loadButtonOverlay) 
            {
                if (this.contain.dataset.loadButtonOverlay === "insideBottomEdge") this.loadBtnContainer.classList.add("insideBottomEdge");
                if (this.contain.dataset.loadButtonOverlay === "insideCenter") this.loadBtnContainer.classList.add("insideCenter");
            }
        this.loadBtnPrefix = "Load";
        if (this.contain.dataset.loadBtnPrefix) 
        {
            this.loadBtnPrefix = this.contain.dataset.loadBtnPrefix;
        }
        for (let m = 0; m < this.models.length; m++) {
            const _loadBtn = document.createElement("input");
            _loadBtn.setAttribute("type", "button");
            let _displayName = this.models[m].name === undefined ? m.toString(): this.models[m].name;
            _loadBtn.setAttribute("value", `${this.loadBtnPrefix}${this.loadBtnPrefix.length>1?" ":""}${_displayName}`);
            _loadBtn.classList.add("load_btn");
            _loadBtn.addEventListener("click", this._loadModelsFactory(this.models[m]).bind(this));
            this.loadBtnContainer.appendChild(_loadBtn);
        }
        this.contain.appendChild(this.loadBtnContainer);


        if ( WebGL.isWebGL2Available() ) {
            this.renderer.setAnimationLoop( this.animate.bind(this) );
        
        } else {
        
            const warning = WebGL.getWebGL2ErrorMessage();
            document.getElementById( 'container' ).appendChild( warning );
        
        }
        if (this.contain.dataset.autoload) 
        {
            if (this.contain.dataset.autoload === "true") 
                {
                    this.loadAndAddModule(this.models[0]);
                    if (this.models.length <= 1) this.removeLoadButtons();
                }
        }
        
    }
    removeLoadButtons() {
        this.loadBtnContainer.remove(this.contain);
    }
    /**
     * @param {ImportedDataModel} $importedDataModel e.g., this.models[this.visibleModelIndex]
     */
    hideShowLabelControls($importedDataModel) {
        if (!($importedDataModel instanceof ImportedDataModel)) return;
        const _idm = $importedDataModel;
        if (_idm.labels.length <= 0) 
        {
            if (!this.labelToggleContain.classList.contains("hidden")) 
            {
                this.labelToggleContain.classList.add("hidden");
            }
        }
        else 
        {
            if (this.labelToggleContain.classList.contains("hidden")) 
            {
                this.labelToggleContain.classList.remove("hidden");
            }
        }
    }
    labelToggleClick($e) {
        this.toggleLabels();
    }
    toggleLabels() {
        if (this.labelsOn === true) {
            this.setLabelsVisibility(false);
        }
        else 
        {
            this.setLabelsVisibility(true);
        }
    }
    setLabelsVisibility($bool) {
        this.labelsOn = $bool;
        if ($bool === true) 
        {
            // this.svgLabels.classList.remove("hidden");
            this.svgLabelView.revealLabels();
        }
        else 
        {
            // this.svgLabels.classList.add("hidden");
            this.svgLabelView.hideLabels();
        }
    }
    toggleActCamBtnClicked($e) {
        this.toggleActiveCamera();
    }
    toggleActiveCamera() {
        if (this.activeCamera === this.camera)
        {
            this.activeCamera = this.debugCamera;
            this.controls.enableRotate = false;
            this.scene.add( this.camHelper );
        } 
        else 
        {
            this.activeCamera = this.camera;
            this.controls.enableRotate = true;
            this.scene.remove( this.camHelper );
        }

    }
    resetCameraClick($e) {
        this.resetCamera();
    }
    moveCameraClick($e) {
        console.log($e.currentTarget);
        const _btnData = this.presetViewMap.get($e.currentTarget);
        const _pos = _btnData.position;
        this.repositionCamera(_pos.x, _pos.y, _pos.z);
    }
    repositionCamera($x, $y, $z) {
        if (this._isPersp === true) 
        {
            this.camera.position.setX($x);
            this.camera.position.setY($y);
            this.camera.position.setZ($z);
        }
        else
        {
            this.camera.up.set(0,1,0);
            this.camera.position.set($x,$y,$z);
        } 
        this.controls.target.setX(0);
        this.controls.target.setY(0);
        this.controls.target.setZ(0);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
    }
    resetCamera() {
        if (this._isPersp === true) 
        {
            this.camera.position.setX(this._camStartPos.x);
            this.camera.position.setY(this._camStartPos.y);
            this.camera.position.setZ(this._camStartPos.z);
        }
        else
        {
            this.camera.up.set(0,1,0);
            this.camera.position.set(0,0,10);
        } 
        this.controls.target.setX(0);
        this.controls.target.setY(0);
        this.controls.target.setZ(0);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
    }
    animate() {
        // console.log("*************************  Animate");
        // console.log(this);
        if (this._debug)
        {
            this.debugControlsLi.textContent = `orbit: {A:${(this.controls.getAzimuthalAngle()).toPrecision(2)},P:${(this.controls.getPolarAngle()).toPrecision(2)}}`;
            this.debugOrthoZoomLi.textContent = `camera (ortho) zoom: ${(this.camera.zoom).toPrecision(3)}`;
            // this.debugPersZoomLi.textContent = `camera (pers) zoom : ${objPropsToString(this.camera.position)}`;
            // this.debugContain.innerHTML += "<li>camera (pers) distance : " + this.camera.position.length().toPrecision(3) + "</li>";
            // debugContain.innerHTML += "controls.maxAzimuthAngle : " + controls.maxAzimuthAngle;
            // console.log(this.camera.position.x);
            // if (this.camera.position.x.toPrecision === undefined) {
            //     console.log("No definition");
            //     console.log(typeof this.camera.position.x);
            // }
            this.debugCamPosLi.textContent = `camera position : {"x":${this.camera.position.x.toPrecision(3)},"y":${this.camera.position.y.toPrecision(3)},"z":${this.camera.position.z.toPrecision(3)}}`;
            this.debugTargPosLi.textContent = `camera target : ${this.controls.target.x.toPrecision(2)}, ${this.controls.target.y.toPrecision(3)}, ${this.controls.target.z.toPrecision(3)}`; 
        }
        
        // If a model has been loaded already...
        if (this.visibleModelIndex !== undefined) {
            // console.log(visibleModelIndex);
            // viewLabels is a Map instance that allows lookups of
            // the label objects used in the application's view (mVc)
            const _modelViewMap = this.svgLabelView.viewLabels.get(this.models[this.visibleModelIndex]);
            //
            // needed to create smooth transform of labels
            // https://discourse.threejs.org/t/project-world-position-to-screen-coordinate-system/2477
            this.camera.updateMatrixWorld();
    
            // Calculate the current direction the camera is facing
            // as a vector3.
            let _camDirection = new THREE.Vector3( 0, 0, 0 );
            // Rotate the vector3 to match the direction that 
            // camera is pointing in the world space
            // this.camera.getWorldDirection(_camDirection);
            this.activeCamera.getWorldDirection(_camDirection);
            // Uncomment when making debug visualization
            // Makes the output line larger.
            // _direction.multiplyScalar(10);
            const _halfContW = this.containDimensions.width/2;
            const _halfContH = this.containDimensions.height/2;
            // console.log(this.models[this.visibleModelIndex].labels.length);
            // For each label associated with the active model
            for (let i = 0; i < this.models[this.visibleModelIndex].labels.length; i++) {
                // 
                const _label3D = this.models[this.visibleModelIndex].labels[i];
                // 
                // Clone the THREEJS vector3 object to avoid altering the values 
                // when we project in next step.
                const _labelPos = _label3D.position.clone();
                // const posScrnSpc = _labelPos.project(camera);
                //
                const _label2DView = _modelViewMap.get(_label3D);
                // TODO This refresh line fixes a bug with labels added to meshes that have already loaded but is inefficient
                _label2DView.refreshText();
                //_label2DView.updateLabelView(_label3D, _camDirection, this.camera, _halfContW, _halfContH);
                _label2DView.updateLabelView(_label3D, _camDirection, this.activeCamera, _halfContW, _halfContH);
                // updateLabelView(modelViewMap.get(label3D), label3D, _camDirection);
            }
        }
        // 
        // this.lightGroup.lookAt ( this.camera );
        // console.log(this.fillLight.position.x);
        
        this.lightGroup.updateMatrix();
        this.lightGroup.updateMatrixWorld();
        this._keyLightHelper.updateMatrix();
        this._keyLightHelper.updateMatrixWorld();
        // this.renderer.render( this.scene, this.camera );
        this.renderer.render( this.scene, this.activeCamera );
    }

    /**
     * Called after the GLTF loader successfully loads the model
     * @param {Object} $gltf The argument to onLoad will be an Object that contains loaded parts: .scene, .scenes, .cameras, .animations, and .asset.
     */
    onGLTFModelLoaded($gltf) {
        this.preloaderGraphic.remove(this.svgLabelView.svgLabels);
        this.scene.add( $gltf.scene );

        // this.visibleModelIndex = this.index;
        this.visibleModelIndex = this.loadingModelIndex;
        this.loadingModelIndex = undefined;
        // ImportedDataModel 
        const _currentDataModel = this.models[this.visibleModelIndex];
        _currentDataModel.loaded = true;
        _currentDataModel.gltf = $gltf;
        
        // console.log(this.scene.children);
        // console.log($gltf.scene.children);

        // Deal with labels
        // Cycle through each 3DObject in the scene
        const labelIndexes = [];
        for (let i = 0; i < $gltf.scene.children.length; i++) 
        {
            // Create reference to an imported 3D object from the GLTF/GLB file
            const obj3d = $gltf.scene.children[i];
            // imported objects that are meant to serve as labels
            // have a string value that begins with a particular substring.
            // Check for the substring. 
            if (obj3d.name.startsWith(Label3D.labelPrefix)) 
            {
                // The substring exists...

                // Strip the label prefix from the string
                const labelNoPrefix = obj3d.name.substring(Label3D.labelPrefix.length);
                
                // Strip other underscores
                const labelStripped = labelNoPrefix.replaceAll('_', " ");
                
                // console.log("label:" + labelStripped);
                const _label3d = new Label3D(obj3d.position, labelStripped);
                
                // Add the current loop index to the beginning of an
                // array. This will be used later to remove the label
                // geometry from the scene in the correct order.
                labelIndexes.unshift(i);

                //////////////////////////////////////
                ////
                //// Show/record normal/up of label object
                ////
                //////////////////////////////////////
                let _direction = new THREE.Vector3( 0, 1, 0 );
                // _direction.setFromEuler(obj3d.rotation); // This did not work
                
                // Rotate the vector3 to match the direction of the 
                // label up direction
                _direction.transformDirection(obj3d.matrix);

                // console.log(obj3d.position.isVector3);
                // console.log(_direction.isVector3);
                
                //
                const _finalVect = obj3d.position.clone();
                
                //
                _finalVect.add(_direction);
                
                //
                const _line = CreateAddLine(obj3d.position, _finalVect);

                // 
                _label3d.setDirection(_direction.clone());
                // Store a reference to the label value
                _currentDataModel.labels.push(_label3d);
                

                if (this._debug === true) {
                    this.scene.add(_line);
                }
                
            } else {
                // TODO Create an option to find and choose an
                // initial position of the object (when camera starts
                // in normal negative z axis position)
                // this.transControls.setMode( 'rotate' );
                // this.transControls.attach(obj3d);
                // this.scene.add(this.transControls);
            }

            // Show the properties in each imported three d object
            // from the GLTF/GLB file.
            // for (let prop in obj3d) {
            //     console.log(prop + ":" + obj3d[prop]);
            // }
        }
        // Loop through the labels and remove the associated
        // geometry from the scene. Also record the normal/up vector
        // of each label object.
        for (let j = 0; j < labelIndexes.length; j++)
        {
            //
            const labelIndex = labelIndexes[j];
            
            //
            const obj3d = $gltf.scene.children[labelIndex];

            
            // Remove all label meshes
            // remove the label geometry/mesh from the scene
            obj3d.removeFromParent();
        }

        /////////////////////////////////
        // Create label view
        ////////////////////////////////
        for (let i = 0; i < _currentDataModel.labels.length; i++) 
        {
            // Create a reference to a Label3D instance
            const _label3d = _currentDataModel.labels[i];
            // Create a reference to the Map
            // that connects a Label3D instance
            // to a Label2DView instance.
            // 'this' refers to the bound 
            // instance of a ImportedDataModel
            const _map = this.svgLabelView.viewLabels.get(_currentDataModel);
            // console.log(_label3d);
            // const _label2dView = createLabelView(_label3d);
            const _label2dView = new Label2DView(_label3d);
            _map.set(_label3d, _label2dView);
            // Add the label to the SVG container
            this.svgLabelView.addLabelView(_label2dView);
        }
        // decide if labels visibilty controls shouold be displayed or not
        this.hideShowLabelControls(_currentDataModel);

        // Show camera reset button
        this.contain.appendChild(this.cameraControlsDiv);
    }

    /**
     * 
     * @param {ImportedDataModel} $importDataModel 
     */
    loadAndAddModule($importDataModel) {
        //
        const _index = $importDataModel.index;

        // Is another model already being displayed? 
        if (this.visibleModelIndex !== undefined) {
            // Model displayed, so remove
            this.scene.remove( this.models[this.visibleModelIndex].gltf.scene );
            // or
            // models[visibleModelIndex].gltf.scene.removeFromParent();
            const _map = this.svgLabelView.viewLabels.get(this.models[this.visibleModelIndex]);
            for (let i = 0; i < this.models[this.visibleModelIndex].labels.length; i++) {
                const _label3d = this.models[this.visibleModelIndex].labels[i];
                const _label2dview = _map.get(_label3d);
                this.svgLabelView.removeLabelView(_label2dview);
            }
            
        }
        // Is the model already loaded?
        if (this.models[_index].loaded === false) {
            // Model is not already loaded...
            this.loadingModelIndex = $importDataModel.index;
            this.preloaderGraphic.add(this.svgLabelView.svgLabels);
            // If not, then load it...
            this.loader.load( this.models[_index].filePath, this.onGLTFModelLoaded.bind(this), this.onGLTFModelLoading.bind(this), function ( error ) { console.error( error ); } );
            // loader.load( models[_index].filePath, onGLTFModelLoaded.bind(models[_index]), undefined, function ( error ) { console.error( error ); } );
        } else {
            // Model already loaded, add it to the scene
            console.log("Model already loaded");
            this.visibleModelIndex = _index;
            this.scene.add(this.models[this.visibleModelIndex].gltf.scene);
            // Add labels
            const _map = this.svgLabelView.viewLabels.get(this.models[this.visibleModelIndex]);
            // decide if labels visibilty controls shouold be displayed or not
            this.hideShowLabelControls(this.models[this.visibleModelIndex]);

            for (let i = 0; i < this.models[this.visibleModelIndex].labels.length; i++) 
            {
                const _label3d = this.models[this.visibleModelIndex].labels[i];
                const _label2dview = _map.get(_label3d);
                this.svgLabelView.addLabelView(_label2dview);
            }
        }
    }
    onGLTFModelLoading($xhr) 
    {
        const _pLoaded = $xhr.loaded / $xhr.total * 100;
        // console.log("%loaded = " + _pLoaded);
        this.preloaderGraphic.update(_pLoaded);
    }
    _loadModelsFactory($importDataModel) {
        return function($event) {
            if (this.models.length <= 1) this.removeLoadButtons();
            this.loadAndAddModule($importDataModel);
        }
    }

}
BMC_3DViewer.Instances = [];
BMC_3DViewer.Init = function() {
    const _3dViewInstances = document.querySelectorAll("div.bmc_3dviewer");
    for (let _index = 0; _index < _3dViewInstances.length; _index++) {
        const _element = _3dViewInstances[_index];
        BMC_3DViewer.Instances.push(new BMC_3DViewer(_element));
    }
}



function CreateAddLine($v3_1, $v3_2, $colour = 0xff0000) {
    //create a blue LineBasicMaterial
    const materialLine = new THREE.LineBasicMaterial( { color: $colour } );
    const points = [];
    // points.push( new THREE.Vector3( - 2, 0, 0 ) );
    // points.push( new THREE.Vector3( 0, 2, 0 ) );
    points.push( $v3_1 );
    points.push( $v3_2 );
    // points.push( new THREE.Vector3( 2, 0, 0 ) );
    const geometryLine = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometryLine, materialLine );
    return line;
    //scene.add( line );
}



function objPropsToConsole($obj) {
    console.log("*** obj prop dump start ***");
    for (let prop in $obj) {
        console.log(`   ${prop} : ${$obj[prop]}` );
    }
    console.log("*** obj prop dump end ***");
}
function objPropsToString($obj) {
    let _str = "";
    // console.log("*** obj prop dump start ***");
    for (let prop in $obj) {
       _str += `${prop} : ${$obj[prop]} <br>`;
    }
    // console.log("*** obj prop dump end ***");
    return _str;
}

BMC_3DViewer.Init();