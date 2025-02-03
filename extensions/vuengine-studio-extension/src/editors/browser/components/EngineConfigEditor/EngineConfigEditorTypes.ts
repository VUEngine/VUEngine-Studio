import { MacroData } from '../Common/MacrosList';

export interface EngineConfigDataAffine {
    maxRowsPerCall: number,
    maxScale: number
}

export interface EngineConfigDataAnimation {
    maxAnimationFunctionNameLength: number,
    maxFramesPerAnimationFunction: number
}

export interface EngineConfigDataBrightness {
    brightRed: number,
    darkRed: number,
    fadeDelay: number,
    fadeIncrement: number,
    mediumRed: number
}

export interface EngineConfigDataChars {
    totalChars: number
}

export interface EngineConfigDataCommunications {
    enable: boolean
}

export interface EngineConfigDataDebug {
    alertVipOvertime: boolean,
    dimmForProfiling: boolean,
    enableProfiler: boolean,
    printFramerate: boolean,
    profileStreaming: boolean,
    showDetailedMemoryPoolStatus: boolean,
    showMemoryPoolStatus: boolean,
    showStackOverflowAlert: boolean,
    showStreamingProfiling: boolean,
    stackHeadroom: number
}

export interface EngineConfigDataExceptions {
    position: {
        x: number,
        y: number
    }
}

export interface EngineConfigDataFrameRate {
    frameCycle: number,
    runDelayedMessagesAtHalfFrameRate: boolean,
    timerResolution: number
}

export interface EngineConfigDataMath {
    fixedPointPrecision: number
}

export interface EngineConfigDataMemoryPool {
    objects: number
    size: number
}

export interface EngineConfigDataMemoryPools {
    cleanUp: boolean,
    pools: EngineConfigDataMemoryPool[],
    warningThreshold: number
}

export interface EngineConfigDataOptics {
    baseFactor: number,
    cameraNearPlane: number,
    horizontalViewPointCenter: number,
    maximumXViewDistance: number,
    maximumYViewDistance: number,
    scalingModifierFactor: number,
    screenDepth: number,
    screenHeight: number,
    screenWidth: number,
    useLegacyCoordinateProjection: boolean,
    verticalViewPointCenter: number
}

export interface EngineConfigDataPalettes {
    bgMapPalette0: string,
    bgMapPalette1: string,
    bgMapPalette2: string,
    bgMapPalette3: string,
    objectPalette0: string,
    objectPalette1: string,
    objectPalette2: string,
    objectPalette3: string,
    printingPalette: number
}

export interface EngineConfigDataPhysics {
    angleToPreventColliderDisplacement: number,
    frictionForceFactorPower: number,
    gravity: number,
    highPrecision: boolean,
    maximumBouncinessCoefficient: number,
    maximumFrictionCoefficient: number,
    stopBouncingVelocityThreshold: number,
    stopVelocityThreshold: number,
    timeElapsedDivisor: number
    collidersMaximumSize: number
}

export interface EngineConfigDataRandom {
    addUserInputAndTimeToRandomSeed: boolean,
    seedCycles: number
}

export interface EngineConfigDataSound {
    earDisplacement: number,
    stereoAttenuationDistance: number
}

export interface EngineConfigDataSprite {
    hackBgmapSpriteHeight: boolean,
    spritesRotateIn3D: boolean,
    totalLayers: number,
    totalObjects: number
}

export interface EngineConfigDataSram {
    totalSram: number
}

export interface EngineConfigDataTexture {
    bgmapsPerSegments: number,
    paramTableSegments: number,
    printing: {
        offset: {
            parallax: number,
            x: number,
            y: number
        },
        printableArea: number
    }
}

export interface EngineConfigDataWireframes {
    frustumExtensionPower: number,
    interlacedThreshold: number,
    lineShrinkingPadding: number,
    sort: boolean,
    verticalLineOptimization: boolean
}

export interface EngineConfigData {
    affine: EngineConfigDataAffine,
    animation: EngineConfigDataAnimation,
    brightness: EngineConfigDataBrightness,
    chars: EngineConfigDataChars,
    communications: EngineConfigDataCommunications,
    debug: EngineConfigDataDebug,
    exceptions: EngineConfigDataExceptions,
    frameRate: EngineConfigDataFrameRate,
    macros: MacroData[],
    math: EngineConfigDataMath,
    memoryPools: EngineConfigDataMemoryPools,
    optics: EngineConfigDataOptics,
    palettes: EngineConfigDataPalettes,
    physics: EngineConfigDataPhysics,
    random: EngineConfigDataRandom,
    sound: EngineConfigDataSound,
    sprite: EngineConfigDataSprite,
    sram: EngineConfigDataSram,
    texture: EngineConfigDataTexture,
    wireframes: EngineConfigDataWireframes
}

export const AFFINE_MAX_ROWS_MIN_VALUE = 1;
export const AFFINE_MAX_ROWS_MAX_VALUE = 128;
export const AFFINE_MAX_ROWS_DEFAULT_VALUE = 16;
export const AFFINE_MAX_SCALE_MIN_VALUE = 1;
export const AFFINE_MAX_SCALE_MAX_VALUE = 8;
export const AFFINE_MAX_SCALE_DEFAULT_VALUE = 2;

export const MAX_ANIMATION_FUNCTION_NAME_LENGTH_MIN_VALUE = 1;
export const MAX_ANIMATION_FUNCTION_NAME_LENGTH_MAX_VALUE = 128;
export const MAX_ANIMATION_FUNCTION_NAME_LENGTH_DEFAULT_VALUE = 16;
export const MAX_FRAMES_PER_ANIMATION_FUNCTION_MIN_VALUE = 1;
export const MAX_FRAMES_PER_ANIMATION_FUNCTION_MAX_VALUE = 2048;
export const MAX_FRAMES_PER_ANIMATION_FUNCTION_DEFAULT_VALUE = 16;

export const BRIGHTNESS_BRIGHT_MIN_VALUE = 0;
export const BRIGHTNESS_BRIGHT_MAX_VALUE = 256;
export const BRIGHTNESS_BRIGHT_DEFAULT_VALUE = 128;
export const BRIGHTNESS_MEDIUM_MIN_VALUE = 0;
export const BRIGHTNESS_MEDIUM_MAX_VALUE = 256;
export const BRIGHTNESS_MEDIUM_DEFAULT_VALUE = 64;
export const BRIGHTNESS_DARK_MIN_VALUE = 0;
export const BRIGHTNESS_DARK_MAX_VALUE = 256;
export const BRIGHTNESS_DARK_DEFAULT_VALUE = 32;

export const FADE_DELAY_MIN_VALUE = 1;
export const FADE_DELAY_MAX_VALUE = 255;
export const FADE_DELAY_DEFAULT_VALUE = 16;
export const FADE_INCREMENT_MIN_VALUE = 1;
export const FADE_INCREMENT_MAX_VALUE = 64;
export const FADE_INCREMENT_DEFAULT_VALUE = FADE_INCREMENT_MIN_VALUE;

export const EXCEPTION_POSITION_X_MIN_VALUE = 0;
export const EXCEPTION_POSITION_X_MAX_VALUE = 47;
export const EXCEPTION_POSITION_X_DEFAULT_VALUE = 0;
export const EXCEPTION_POSITION_Y_MIN_VALUE = 0;
export const EXCEPTION_POSITION_Y_MAX_VALUE = 27;
export const EXCEPTION_POSITION_Y_DEFAULT_VALUE = 0;

export const FRAME_CYCLE_MIN_VALUE = 0;
export const FRAME_CYCLE_MAX_VALUE = 3;
export const FRAME_CYCLE_DEFAULT_VALUE = 0;
export const TARGET_FPS_OPTIONS: number[] = [
    50,
    25,
    12.5,
    6.25,
];

export const TIMER_RESOLUTION_MIN_VALUE = 1;
export const TIMER_RESOLUTION_MAX_VALUE = 128;
export const TIMER_RESOLUTION_DEFAULT_VALUE = 10;
export const DELAYED_MESSAGES_HALF_FRAME_RATE_DEFAULT_VALUE = false;

export const STACK_HEADROOM_MIN_VALUE = 1;
export const STACK_HEADROOM_MAX_VALUE = 65536;
export const STACK_HEADROOM_DEFAULT_VALUE = 1000;

export const ALERT_VIP_OVERTIME_DEFAULT_VALUE = false;
export const ENABLE_PROFILER_DEFAULT_VALUE = false;
export const DIMM_FOR_PROFILING_DEFAULT_VALUE = false;
export const PROFILE_STREAMING_DEFAULT_VALUE = false;
export const SHOW_STREAMING_PROFILING_DEFAULT_VALUE = false;
export const PRINT_FRAMERATE_DEFAULT_VALUE = false;
export const SHOW_MEMORY_POOL_STATUS_DEFAULT_VALUE = false;
export const SHOW_DETAILED_MEMORY_POOL_STATUS_DEFAULT_VALUE = false;
export const SHOW_STACK_OVERFLOW_ALERT_DEFAULT_VALUE = false;

export const TOTAL_CHARS_MIN_VALUE = 1;
export const TOTAL_CHARS_MAX_VALUE = 32768;
export const TOTAL_CHARS_DEFAULT_VALUE = 2048;

export const COMMUNICATIONS_ENABLE_DEFAULT_VALUE = false;

export const FIXED_POINT_PRECISION_MIN_VALUE = 6;
export const FIXED_POINT_PRECISION_MAX_VALUE = 13; // TODO: make dropdown
export const FIXED_POINT_PRECISION_DEFAULT_VALUE = 6;
export const SEED_CYCLES_MIN_VALUE = 1;
export const SEED_CYCLES_MAX_VALUE = 64;
export const SEED_CYCLES_DEFAULT_VALUE = 2;
export const SEED_ADD_USER_INPUT_DEFAULT_VALUE = false;

export const MEMORY_POOLS_TOTAL_AVAILABLE_SIZE = 65536;
export const MEMORY_POOLS_WARNING_THRESHOLD = 58000;
export const MEMORY_POOLS_ERROR_THRESHOLD = 60000;
export const MEMORY_POOL_SIZE_STEP = 4;
export const MEMORY_POOL_SIZE_MIN_VALUE = MEMORY_POOL_SIZE_STEP;
export const MEMORY_POOL_SIZE_MAX_VALUE = 1024;
export const MEMORY_POOL_SIZE_DEFAULT_VALUE = MEMORY_POOL_SIZE_MIN_VALUE;
export const MEMORY_POOL_OBJECTS_MIN_VALUE = 1;
export const MEMORY_POOL_OBJECTS_MAX_VALUE = 4096;
export const MEMORY_POOL_OBJECTS_DEFAULT_VALUE = 1;
export const MEMORY_POOLS_WARNING_THRESHOLD_MIN_VALUE = 1;
export const MEMORY_POOLS_WARNING_THRESHOLD_MAX_VALUE = 100;
export const MEMORY_POOLS_WARNING_THRESHOLD_DEFAULT_VALUE = 85;
export const MEMORY_POOLS_CLEAN_UP_DEFAULT_VALUE = false;

export const BGMAP_PALETTE_0_DEFAULT_VALUE = '11100100';
export const BGMAP_PALETTE_1_DEFAULT_VALUE = '11100000';
export const BGMAP_PALETTE_2_DEFAULT_VALUE = '10010000';
export const BGMAP_PALETTE_3_DEFAULT_VALUE = '01010000';
export const OBJECT_PALETTE_0_DEFAULT_VALUE = '11100100';
export const OBJECT_PALETTE_1_DEFAULT_VALUE = '11100000';
export const OBJECT_PALETTE_2_DEFAULT_VALUE = '10010000';
export const OBJECT_PALETTE_3_DEFAULT_VALUE = '01010000';
export const PRINTING_PALETTE_MIN_VALUE = 0;
export const PRINTING_PALETTE_MAX_VALUE = 3;
export const PRINTING_PALETTE_DEFAULT_VALUE = 3;

export const BASE_FACTOR_MIN_VALUE = 0;
export const BASE_FACTOR_MAX_VALUE = 4096;
export const BASE_FACTOR_DEFAULT_VALUE = 32;

export const CAMERA_NEAR_PLANE_MIN_VALUE = 0;
export const CAMERA_NEAR_PLANE_MAX_VALUE = 4096;
export const CAMERA_NEAR_PLANE_DEFAULT_VALUE = 0;

export const MAX_VIEW_DISTANCE_X_MIN_VALUE = 0;
export const MAX_VIEW_DISTANCE_X_MAX_VALUE = 65536;
export const MAX_VIEW_DISTANCE_X_DEFAULT_VALUE = 2048;

export const MAX_VIEW_DISTANCE_Y_MIN_VALUE = 0;
export const MAX_VIEW_DISTANCE_Y_MAX_VALUE = 65536;
export const MAX_VIEW_DISTANCE_Y_DEFAULT_VALUE = 4096;

export const SCALING_MODIFIER_FACTOR_MIN_VALUE = 0;
export const SCALING_MODIFIER_FACTOR_MAX_VALUE = 255;
export const SCALING_MODIFIER_FACTOR_DEFAULT_VALUE = 1;

export const SCREEN_DEPTH_MIN_VALUE = 0;
export const SCREEN_DEPTH_MAX_VALUE = 16384;
export const SCREEN_DEPTH_DEFAULT_VALUE = 2048;

export const SCREEN_HEIGHT_MIN_VALUE = 0;
export const SCREEN_HEIGHT_MAX_VALUE = 16384;
export const SCREEN_HEIGHT_DEFAULT_VALUE = 224;

export const SCREEN_WIDTH_MIN_VALUE = 0;
export const SCREEN_WIDTH_MAX_VALUE = 16384;
export const SCREEN_WIDTH_DEFAULT_VALUE = 384;

export const USE_LEGACY_COORDINATE_PROJECTION_DEFAULT_VALUE = false;

export const VIEW_POINT_CENTER_HORIZONTAL_MIN_VALUE = 0;
export const VIEW_POINT_CENTER_HORIZONTAL_MAX_VALUE = 1024;
export const VIEW_POINT_CENTER_HORIZONTAL_DEFAULT_VALUE = 192;

export const VIEW_POINT_CENTER_VERTICAL_MIN_VALUE = 0;
export const VIEW_POINT_CENTER_VERTICAL_MAX_VALUE = 1024;
export const VIEW_POINT_CENTER_VERTICAL_DEFAULT_VALUE = 112;

export const EAR_DISPLACEMENT_MIN_VALUE = 0;
export const EAR_DISPLACEMENT_MAX_VALUE = 1024;
export const EAR_DISPLACEMENT_DEFAULT_VALUE = 384;

export const STEREO_ATTENUATION_DISTANCE_MIN_VALUE = 0;
export const STEREO_ATTENUATION_DISTANCE_MAX_VALUE = 16384;
export const STEREO_ATTENUATION_DISTANCE_DEFAULT_VALUE = 2048;

export const ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MIN_VALUE = 0;
export const ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_MAX_VALUE = 128;
export const ANGLE_TO_PREVENT_COLLIDER_DISPLACEMENT_DEFAULT_VALUE = 10;

export const FRICTION_FORCE_FACTOR_POWER_MIN_VALUE = 0;
export const FRICTION_FORCE_FACTOR_POWER_MAX_VALUE = 64;
export const FRICTION_FORCE_FACTOR_POWER_DEFAULT_VALUE = 2;

export const GRAVITY_MIN_VALUE = 0;
export const GRAVITY_MAX_VALUE = 100;
export const GRAVITY_DEFAULT_VALUE = 10;

export const PHYSICS_HIGH_PRECISION_DEFAULT_VALUE = false;

export const MAXIMUM_BOUNCINESS_COEFFICIENT_MIN_VALUE = 0;
export const MAXIMUM_BOUNCINESS_COEFFICIENT_MAX_VALUE = 64;
export const MAXIMUM_BOUNCINESS_COEFFICIENT_DEFAULT_VALUE = 1;

export const MAXIMUM_FRICTION_COEFFICIENT_MIN_VALUE = 0;
export const MAXIMUM_FRICTION_COEFFICIENT_MAX_VALUE = 256;
export const MAXIMUM_FRICTION_COEFFICIENT_DEFAULT_VALUE = 1;

export const STOP_BOUNCING_VELOCITY_THRESHOLD_MIN_VALUE = 0;
export const STOP_BOUNCING_VELOCITY_THRESHOLD_MAX_VALUE = 1024;
export const STOP_BOUNCING_VELOCITY_THRESHOLD_DEFAULT_VALUE = 48;

export const STOP_VELOCITY_THRESHOLD_MIN_VALUE = 0;
export const STOP_VELOCITY_THRESHOLD_MAX_VALUE = 512;
export const STOP_VELOCITY_THRESHOLD_DEFAULT_VALUE = 8;

export const TIME_ELAPSED_DIVISOR_MIN_VALUE = 0;
export const TIME_ELAPSED_DIVISOR_MAX_VALUE = 64;
export const TIME_ELAPSED_DIVISOR_DEFAULT_VALUE = 2;

export const COLLIDERS_MAX_SIZE_MIN_VALUE = 0;
export const COLLIDERS_MAX_SIZE_MAX_VALUE = 4096;
export const COLLIDERS_MAX_SIZE_DEFAULT_VALUE = 256;

export const TOTAL_LAYERS_MIN_VALUE = 1;
export const TOTAL_LAYERS_MAX_VALUE = 32;
export const TOTAL_LAYERS_DEFAULT_VALUE = 32;

export const TOTAL_OBJECTS_MIN_VALUE = 1;
export const TOTAL_OBJECTS_MAX_VALUE = 1024;
export const TOTAL_OBJECTS_DEFAULT_VALUE = 1024;

export const SPRITES_ROTATE_IN_3D_DEFAULT_VALUE = true;

export const HACK_BGMAP_SPRITE_HEIGHT_DEFAULT_VALUE = true;

export const TOTAL_SRAM_MIN_VALUE = 4;
export const TOTAL_SRAM_MAX_VALUE = 16777216;
export const TOTAL_SRAM_DEFAULT_VALUE = 8192;

export const BGMAPS_PER_SEGMENT_MIN_VALUE = 0;
export const BGMAPS_PER_SEGMENT_MAX_VALUE = 128;
export const BGMAPS_PER_SEGMENT_DEFAULT_VALUE = 14;

export const PRINTING_AREA_OFFSET_X_MIN_VALUE = 0;
export const PRINTING_AREA_OFFSET_X_MAX_VALUE = 384;
export const PRINTING_AREA_OFFSET_X_DEFAULT_VALUE = 0;

export const PRINTING_AREA_OFFSET_Y_MIN_VALUE = 0;
export const PRINTING_AREA_OFFSET_Y_MAX_VALUE = 224;
export const PRINTING_AREA_OFFSET_Y_DEFAULT_VALUE = 0;

export const PRINTING_AREA_OFFSET_PARALLAX_MIN_VALUE = 0;
export const PRINTING_AREA_OFFSET_PARALLAX_MAX_VALUE = 128;
export const PRINTING_AREA_OFFSET_PARALLAX_DEFAULT_VALUE = 0;

export const PRINTABLE_AREA_MIN_VALUE = 0;
export const PRINTABLE_AREA_MAX_VALUE = 4096;
export const PRINTABLE_AREA_DEFAULT_VALUE = 1792;

export const PARAM_TABLE_SEGMENTS_MIN_VALUE = 0;
export const PARAM_TABLE_SEGMENTS_MAX_VALUE = 64;
export const PARAM_TABLE_SEGMENTS_DEFAULT_VALUE = 1;

export const WIREFRAMES_SORT_DEFAULT_VALUE = true;

export const WIREFRAMES_INTERLACED_THRESHOLD_MIN_VALUE = 512;
export const WIREFRAMES_INTERLACED_THRESHOLD_MAX_VALUE = 8191;
export const WIREFRAMES_INTERLACED_THRESHOLD_DEFAULT_VALUE = 4096;

export const WIREFRAMES_LINE_SHRINKING_PADDING_MIN_VALUE = 0;
export const WIREFRAMES_LINE_SHRINKING_PADDING_MAX_VALUE = 256;
export const WIREFRAMES_LINE_SHRINKING_PADDING_DEFAULT_VALUE = 0;

export const WIREFRAMES_FRUSTUM_EXTENSION_POWER_MIN_VALUE = 0;
export const WIREFRAMES_FRUSTUM_EXTENSION_POWER_MAX_VALUE = 4;
export const WIREFRAMES_FRUSTUM_EXTENSION_POWER_DEFAULT_VALUE = 0;

export const WIREFRAMES_VERTICAL_LINE_OPTIMIZATION_DEFAULT_VALUE = false;
